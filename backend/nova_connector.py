"""
Nova launch monitor connector.

Discovers a Nova device on the local network via mDNS, connects to its
WebSocket (port 2920), enriches each raw shot through open-golf-coach,
then calls the broadcast callback so main.py can push it to all clients.

Usage in main.py:
    connector = NovaConnector(broadcast_fn)
    await connector.start()
    ...
    await connector.stop()
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Callable, Awaitable, Optional

import websockets
from zeroconf.asyncio import AsyncServiceInfo, AsyncZeroconf, AsyncServiceBrowser
from simulator import enrich_with_ogc, CLUB_PROFILES

log = logging.getLogger(__name__)

NOVA_SERVICE_TYPE = "_openlaunch-ws._tcp.local."
NOVA_DEFAULT_PORT = 2920
RECONNECT_DELAY   = 5    # seconds between reconnect attempts
DISCOVER_TIMEOUT  = 10   # seconds to wait for mDNS discovery


class NovaConnector:
    def __init__(self, on_shot: Callable[[dict], Awaitable[None]], session_id: str = "nova_live"):
        self._on_shot     = on_shot
        self._session_id  = session_id
        self._host: Optional[str] = None
        self._port: int           = NOVA_DEFAULT_PORT
        self._shot_counter: int   = 0
        self.is_connected: bool   = False
        self.is_discovering: bool = False
        self._stop_event  = asyncio.Event()
        self._task: Optional[asyncio.Task] = None
        self._zc: Optional[AsyncZeroconf]  = None

    # ── public ────────────────────────────────────────────────────────────────

    async def start(self):
        self._stop_event.clear()
        self._task = asyncio.create_task(self._run(), name="nova_connector")

    async def stop(self):
        self._stop_event.set()
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        if self._zc:
            await self._zc.async_close()

    @property
    def status(self) -> dict:
        return {
            "nova_available":  self._host is not None,
            "nova_connected":  self.is_connected,
            "nova_host":       self._host,
            "nova_port":       self._port,
            "discovering":     self.is_discovering,
        }

    # ── mDNS discovery ────────────────────────────────────────────────────────

    async def _discover(self) -> Optional[tuple[str, int]]:
        """Return (host, port) of the first Nova found via mDNS, or None."""
        self.is_discovering = True
        found: asyncio.Future = asyncio.get_event_loop().create_future()

        class _Listener:
            async def async_add_service(self_, zc, type_, name):
                if found.done():
                    return
                info = AsyncServiceInfo(type_, name)
                await info.async_request(zc, 3000)
                if info.addresses:
                    import socket
                    host = socket.inet_ntoa(info.addresses[0])
                    port = info.port or NOVA_DEFAULT_PORT
                    log.info("Nova discovered: %s:%d", host, port)
                    found.set_result((host, port))

            async def async_remove_service(self_, zc, type_, name):
                pass

            async def async_update_service(self_, zc, type_, name):
                pass

        self._zc = AsyncZeroconf()
        browser  = AsyncServiceBrowser(self._zc.zeroconf, NOVA_SERVICE_TYPE, listener=_Listener())

        try:
            result = await asyncio.wait_for(found, timeout=DISCOVER_TIMEOUT)
            return result
        except asyncio.TimeoutError:
            log.debug("No Nova device found on local network.")
            return None
        finally:
            await browser.async_cancel()
            await self._zc.async_close()
            self._zc = None
            self.is_discovering = False

    # ── WebSocket session ─────────────────────────────────────────────────────

    async def _run(self):
        while not self._stop_event.is_set():
            # Try to discover the device
            addr = await self._discover()
            if addr is None:
                log.debug("Retrying Nova discovery in %ds…", RECONNECT_DELAY * 2)
                await asyncio.sleep(RECONNECT_DELAY * 2)
                continue

            self._host, self._port = addr
            uri = f"ws://{self._host}:{self._port}"

            while not self._stop_event.is_set():
                try:
                    log.info("Connecting to Nova at %s", uri)
                    async with websockets.connect(uri, ping_interval=20, ping_timeout=10) as ws:
                        self.is_connected = True
                        log.info("Nova WebSocket connected.")
                        async for raw in ws:
                            if self._stop_event.is_set():
                                break
                            await self._handle_message(raw)
                except (websockets.ConnectionClosed, OSError) as exc:
                    log.warning("Nova disconnected: %s — retrying in %ds", exc, RECONNECT_DELAY)
                finally:
                    self.is_connected = False
                if not self._stop_event.is_set():
                    await asyncio.sleep(RECONNECT_DELAY)

    async def _handle_message(self, raw: str):
        try:
            msg = json.loads(raw)
        except json.JSONDecodeError:
            return

        if msg.get("type") != "shot":
            return

        self._shot_counter += 1

        # Nova sends SI units; OGC expects SI units — direct pass-through
        ball_speed_mph = msg["ball_speed_meters_per_second"] * 2.23694
        v_launch       = msg["vertical_launch_angle_degrees"]
        h_launch       = msg.get("horizontal_launch_angle_degrees", 0.0)
        spin_rpm       = msg["total_spin_rpm"]
        spin_axis      = msg.get("spin_axis_degrees", 0.0)

        enriched = enrich_with_ogc(ball_speed_mph, v_launch, h_launch, spin_rpm, spin_axis)

        if not enriched:
            log.warning("OGC enrichment failed for Nova shot #%d", self._shot_counter)
            return

        # Estimate club_speed from OGC's output (ball_speed / 1.48 typical smash)
        club_speed = round(ball_speed_mph / 1.44, 1)
        smash      = round(ball_speed_mph / club_speed, 3)

        shot = {
            "id":           self._shot_counter,
            "session_id":   self._session_id,
            "timestamp":    datetime.utcnow().isoformat(),
            "club":         _infer_club(enriched["carry_distance"]),
            "ball_speed":   round(ball_speed_mph, 1),
            "club_speed":   club_speed,
            "smash_factor": smash,
            "launch_angle": v_launch,
            "spin_rate":    int(spin_rpm),
            "in_target":    abs(enriched["lateral_offset"]) < 18,
            "shot_number":  self._shot_counter,
            "source":       "nova",
            **enriched,
        }

        await self._on_shot(shot)


def _infer_club(carry_yards: float) -> str:
    """Best-guess club from carry distance when Nova doesn't send club info."""
    thresholds = [
        (260, "Driver"), (230, "3 Wood"), (200, "5 Iron"), (188, "6 Iron"),
        (175, "7 Iron"), (160, "8 Iron"), (145, "9 Iron"), (125, "PW"), (0, "SW"),
    ]
    for yds, club in thresholds:
        if carry_yards >= yds:
            return club
    return "SW"
