"""Fake launch monitor - a GSPro Connect V1 client for testing SwingDash.

Connects to the SwingDash GSPro Connect receiver and sends a heartbeat followed by a few
sample BallData shots, printing the server's acks. Use this to exercise the full
launch-monitor -> open-golf-coach -> dashboard pipeline without any hardware.

Usage:
    python backend/tools/fake_lm.py [host] [port] [count]
"""

import json
import random
import socket
import sys
import time

SAMPLE_SHOTS = [
    {"Speed": 167.0, "VLA": 12.5, "HLA": -1.2, "TotalSpin": 2550, "SpinAxis": -4.0, "BackSpin": 2540, "SideSpin": -178},
    {"Speed": 131.0, "VLA": 18.0, "HLA": 0.8,  "TotalSpin": 6100, "SpinAxis": 2.5,  "BackSpin": 6090, "SideSpin": 266},
    {"Speed": 118.0, "VLA": 24.5, "HLA": 3.5,  "TotalSpin": 7400, "SpinAxis": 14.0, "BackSpin": 7180, "SideSpin": 1790},
    {"Speed": 150.0, "VLA": 14.0, "HLA": -3.5, "TotalSpin": 3100, "SpinAxis": -13.0,"BackSpin": 3020, "SideSpin": -697},
]


def make_message(ball: dict, shot_number: int) -> dict:
    return {
        "DeviceID": "FakeLM-Python",
        "Units": "Yards",
        "ShotNumber": shot_number,
        "APIversion": "1",
        "BallData": ball,
        "ShotDataOptions": {
            "ContainsBallData": True,
            "ContainsClubData": False,
            "LaunchMonitorIsReady": True,
            "LaunchMonitorBallDetected": True,
            "IsHeartBeat": False,
        },
    }


def heartbeat() -> dict:
    return {
        "DeviceID": "FakeLM-Python",
        "Units": "Yards",
        "ShotNumber": 0,
        "APIversion": "1",
        "ShotDataOptions": {
            "ContainsBallData": False,
            "ContainsClubData": False,
            "LaunchMonitorIsReady": True,
            "LaunchMonitorBallDetected": False,
            "IsHeartBeat": True,
        },
    }


def main():
    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 921
    count = int(sys.argv[3]) if len(sys.argv) > 3 else len(SAMPLE_SHOTS)

    print(f"Connecting to GSPro Connect receiver at {host}:{port} ...")
    with socket.create_connection((host, port), timeout=10) as sock:
        sock.settimeout(5)

        def send(obj):
            sock.sendall((json.dumps(obj) + "\n").encode("utf-8"))
            try:
                resp = sock.recv(4096).decode("utf-8", errors="replace").strip()
                print("  <-", resp)
            except socket.timeout:
                print("  <- (no response)")

        print("Heartbeat ->")
        send(heartbeat())

        for i in range(count):
            ball = dict(SAMPLE_SHOTS[i % len(SAMPLE_SHOTS)])
            print(f"Shot {i + 1} -> Speed={ball['Speed']} VLA={ball['VLA']} HLA={ball['HLA']} "
                  f"Spin={ball['TotalSpin']} Axis={ball['SpinAxis']}")
            send(make_message(ball, i + 1))
            time.sleep(1.0)

    print("Done.")


if __name__ == "__main__":
    main()
