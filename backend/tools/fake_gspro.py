"""Fake upstream GSPro - a minimal stand-in for testing SwingDash relay mode.

Listens like GSPro's Open Connect endpoint, acks every shot with a Player object that
reports a selected club, so the relay's GSPro->LM tap (Player.Club / Player.Handed) can be
exercised without running real GSPro.

Usage:
    python backend/tools/fake_gspro.py [port] [club] [handed]
        port   default 922
        club   default I7   (GSPro club code, e.g. DR, W3, I7, PW, PT)
        handed default RH
"""

import asyncio
import json
import sys

CLUB = "I7"
HANDED = "RH"


async def handle(reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
    peer = writer.get_extra_info("peername")
    print(f"[fake_gspro] relay/LM connected: {peer}")
    decoder = json.JSONDecoder()
    buffer = ""
    try:
        while True:
            chunk = await reader.read(4096)
            if not chunk:
                break
            buffer += chunk.decode("utf-8", errors="replace")
            idx, n = 0, len(buffer)
            while idx < n:
                while idx < n and buffer[idx] in " \r\n\t":
                    idx += 1
                if idx >= n:
                    break
                try:
                    msg, end = decoder.raw_decode(buffer, idx)
                except json.JSONDecodeError:
                    break
                idx = end
                opts = msg.get("ShotDataOptions") or {}
                if opts.get("IsHeartBeat"):
                    resp = {"Code": 200, "Message": "Heartbeat received"}
                else:
                    print(f"[fake_gspro] shot received (ShotNumber={msg.get('ShotNumber')}); "
                          f"replying Player.Club={CLUB}")
                    resp = {"Code": 201, "Message": "GSPro Player Information",
                            "Player": {"Handed": HANDED, "Club": CLUB}}
                writer.write((json.dumps(resp) + "\n").encode("utf-8"))
                await writer.drain()
            buffer = buffer[idx:]
    finally:
        print(f"[fake_gspro] disconnected: {peer}")
        writer.close()


async def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 922
    global CLUB, HANDED
    if len(sys.argv) > 2:
        CLUB = sys.argv[2]
    if len(sys.argv) > 3:
        HANDED = sys.argv[3]
    server = await asyncio.start_server(handle, "0.0.0.0", port)
    print(f"[fake_gspro] listening on :{port} (club={CLUB}, handed={HANDED})")
    async with server:
        await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
