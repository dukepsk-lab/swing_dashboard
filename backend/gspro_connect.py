"""GSPro Connect V1 receiver.

SwingDash acts as the *standalone receiver* in the GSPro Open Connect V1 protocol:
it opens a TCP server (default port 921) and the launch monitor connects to it as a
client and pushes shot JSON. We never sit between the launch monitor and a real GSPro
instance - the launch monitor points directly at us.

Protocol reference: https://gsprogolf.com/GSProConnectV1.html

Each inbound message is a JSON object with root fields (DeviceID, Units, ShotNumber,
APIversion), a ShotDataOptions object and a BallData object (plus optional ClubData).
For every message we send back a GSPro-style ack so the launch monitor stays happy.
"""

import asyncio
import json
import logging
from typing import Awaitable, Callable, Optional

log = logging.getLogger("gspro_connect")

DEFAULT_PORT = 921

# Callback signatures
#   on_shot(ball: dict, club: Optional[dict], raw: dict) -> Awaitable
#   on_status(connected: bool, device_id: Optional[str]) -> Awaitable
#   on_player(club_code: Optional[str], handed: Optional[str]) -> Awaitable
OnShot = Callable[[dict, Optional[dict], dict], Awaitable[None]]
OnStatus = Callable[[bool, Optional[str]], Awaitable[None]]
OnPlayer = Callable[[Optional[str], Optional[str]], Awaitable[None]]


def _decode_messages(buffer: str):
    """Split a raw buffer into complete JSON objects.

    Launch monitors stream concatenated JSON objects with no framing (and sometimes
    newlines). We greedily decode from the front using json.JSONDecoder.raw_decode and
    return (messages, remainder) so partial trailing data is kept for the next read.
    """
    decoder = json.JSONDecoder()
    messages = []
    idx = 0
    n = len(buffer)
    while idx < n:
        # Skip any whitespace/newlines between objects
        while idx < n and buffer[idx] in " \r\n\t":
            idx += 1
        if idx >= n:
            break
        try:
            obj, end = decoder.raw_decode(buffer, idx)
        except json.JSONDecodeError:
            # Incomplete or malformed tail - keep it for the next chunk
            break
        messages.append(obj)
        idx = end
    return messages, buffer[idx:]


def _ack(code: int, message: str, player: Optional[dict] = None) -> bytes:
    payload = {"Code": code, "Message": message}
    if player is not None:
        payload["Player"] = player
    return (json.dumps(payload) + "\n").encode("utf-8")


class GSProConnectServer:
    def __init__(self, on_shot: OnShot, on_status: Optional[OnStatus] = None,
                 on_player: Optional[OnPlayer] = None,
                 host: str = "0.0.0.0", port: int = DEFAULT_PORT,
                 upstream_host: Optional[str] = None, upstream_port: int = DEFAULT_PORT):
        self.on_shot = on_shot
        self.on_status = on_status
        self.on_player = on_player
        self.host = host
        self.port = port
        # When upstream_host is set, run as a transparent relay to a real GSPro instance.
        self.upstream_host = upstream_host
        self.upstream_port = upstream_port
        self._server: Optional[asyncio.AbstractServer] = None
        self.connected = False
        self.device_id: Optional[str] = None

    @property
    def mode(self) -> str:
        return "relay" if self.upstream_host else "standalone"

    async def start(self):
        self._server = await asyncio.start_server(self._handle_client, self.host, self.port)
        if self.upstream_host:
            log.info("GSPro Connect relay listening on %s:%s -> upstream GSPro %s:%s",
                     self.host, self.port, self.upstream_host, self.upstream_port)
        else:
            log.info("GSPro Connect receiver listening on %s:%s (standalone)", self.host, self.port)

    async def stop(self):
        if self._server:
            self._server.close()
            try:
                await self._server.wait_closed()
            except Exception:
                pass

    async def _set_status(self, connected: bool, device_id: Optional[str]):
        self.connected = connected
        self.device_id = device_id if connected else None
        if self.on_status:
            try:
                await self.on_status(connected, device_id)
            except Exception:
                log.exception("on_status callback failed")

    async def _handle_client(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        peer = writer.get_extra_info("peername")
        log.info("Launch monitor connected: %s", peer)
        await self._set_status(True, None)

        up_reader = up_writer = None
        if self.upstream_host:
            try:
                up_reader, up_writer = await asyncio.open_connection(self.upstream_host, self.upstream_port)
                log.info("Relaying to upstream GSPro %s:%s", self.upstream_host, self.upstream_port)
            except OSError as e:
                log.error("Upstream GSPro %s:%s unreachable (%s); falling back to self-ack",
                          self.upstream_host, self.upstream_port, e)
                up_reader = up_writer = None

        try:
            if up_reader and up_writer:
                await self._relay(reader, writer, up_reader, up_writer)
            else:
                await self._serve_standalone(reader, writer)
        except (ConnectionResetError, asyncio.IncompleteReadError):
            pass
        except Exception:
            log.exception("Error handling launch monitor connection")
        finally:
            log.info("Launch monitor disconnected: %s", peer)
            await self._set_status(False, None)
            for w in (writer, up_writer):
                if w is not None:
                    try:
                        w.close()
                        await w.wait_closed()
                    except Exception:
                        pass

    async def _serve_standalone(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        """Act as the GSPro endpoint ourselves: parse shots and send our own acks."""
        buffer = ""
        while True:
            chunk = await reader.read(4096)
            if not chunk:
                break  # client closed
            buffer += chunk.decode("utf-8", errors="replace")
            messages, buffer = _decode_messages(buffer)
            for msg in messages:
                await self._process(msg, writer)

    async def _relay(self, lm_reader, lm_writer, up_reader, up_writer):
        """Transparently forward bytes both ways while tapping the stream."""
        await asyncio.gather(
            self._pump(lm_reader, up_writer, self._tap_lm_to_gspro),
            self._pump(up_reader, lm_writer, self._tap_gspro_to_lm),
        )

    async def _pump(self, reader, writer, tap):
        """Forward raw bytes from reader->writer untouched; feed a decode buffer to `tap`."""
        buffer = ""
        while True:
            chunk = await reader.read(4096)
            if not chunk:
                break
            writer.write(chunk)  # transparent: original bytes, never re-serialized
            await writer.drain()
            buffer += chunk.decode("utf-8", errors="replace")
            messages, buffer = _decode_messages(buffer)
            for msg in messages:
                try:
                    await tap(msg)
                except Exception:
                    log.exception("relay tap failed")

    async def _tap_lm_to_gspro(self, msg: dict):
        """Launch monitor -> GSPro: pull ball data for the reverse-calc (no ack; GSPro acks)."""
        options = msg.get("ShotDataOptions") or {}
        if options.get("IsHeartBeat"):
            return
        if not options.get("ContainsBallData", "BallData" in msg):
            return
        ball = msg.get("BallData") or {}
        club = msg.get("ClubData") if options.get("ContainsClubData", "ClubData" in msg) else None
        await self.on_shot(ball, club, msg)

    async def _tap_gspro_to_lm(self, msg: dict):
        """GSPro -> launch monitor: read Player.Club / Player.Handed."""
        player = msg.get("Player")
        if isinstance(player, dict) and self.on_player:
            await self.on_player(player.get("Club"), player.get("Handed"))

    async def _process(self, msg: dict, writer: asyncio.StreamWriter):
        device_id = msg.get("DeviceID")
        if device_id and device_id != self.device_id:
            self.device_id = device_id

        options = msg.get("ShotDataOptions") or {}
        is_heartbeat = options.get("IsHeartBeat", False)
        has_ball = options.get("ContainsBallData", "BallData" in msg)

        if is_heartbeat or not has_ball:
            writer.write(_ack(200, "Heartbeat received"))
            await writer.drain()
            return

        ball = msg.get("BallData") or {}
        club = msg.get("ClubData") if options.get("ContainsClubData", "ClubData" in msg) else None

        try:
            await self.on_shot(ball, club, msg)
            writer.write(_ack(200, "Shot received", player={"Handed": "RH", "Club": "DR"}))
        except Exception:
            log.exception("on_shot callback failed")
            writer.write(_ack(501, "Failure occurred while processing shot"))
        await writer.drain()
