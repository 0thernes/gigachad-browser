"""Independent CPU equations for the bounded ALIVE selective-SSM parity test.

This module does not import or translate JavaScript. Python float arithmetic is
used between explicit IEEE-754 binary32 array stores, matching the declared
TypedArray storage contract. Dot products use math.fsum as an independent sum.
"""
import json
import math
import platform
import struct
import sys


def f32(value):
    return struct.unpack("<f", struct.pack("<f", value))[0]


def vector(value, length, name):
    if not isinstance(value, list) or len(value) != length:
        raise ValueError(f"Invalid shape for {name}; expected {length}")
    if any(not isinstance(x, (int, float)) or not math.isfinite(x) for x in value):
        raise ValueError(f"Nonfinite or nonnumeric input in {name}")
    result = [f32(x) for x in value]
    if not all(map(math.isfinite, result)):
        raise ValueError(f"Input overflows binary32 in {name}")
    return result


def evaluate(case):
    state = case["state"]
    hidden = vector(state["H"], 128, "H")
    rates = vector(state["A"], 128, "A")
    input_scale = vector(state["B"], 128, "B")
    output_scale = vector(state["C"], 128, "C")
    skip = vector(state["D"], 64, "D")
    delta_weights = vector(state["Wdel"], 4096, "Wdel")
    action_weights = vector(state["Wact"], 4096, "Wact")
    traces = []
    for frame in case["frames"]:
        latent = vector(frame["z"], 64, "z")
        perturbation = vector(frame["raut"], 64, "raut")
        action = vector(frame["act32"], 32, "act32")
        mouse_speed = frame["mouseSpeedPx"]
        if not isinstance(mouse_speed, (int, float)) or not math.isfinite(mouse_speed):
            raise ValueError("Nonfinite mouseSpeedPx")
        delta = []
        for channel in range(64):
            neighbor = (channel + 17) % 64
            activation = math.fsum((
                delta_weights[64 * channel + channel] * latent[channel],
                delta_weights[64 * channel + neighbor] * latent[neighbor],
                0.35 * perturbation[channel],
                0.45 if mouse_speed > 12 else 0.0,
            ))
            softplus = math.log(1.0 + math.exp(min(4.0, max(-4.0, activation))))
            delta.append(f32(min(0.165, max(0.012, 0.085 * softplus))))

        projected = [f32(math.fsum(action_weights[32 * row + column] * action[column]
                                  for column in range(32))) for row in range(128)]
        next_hidden = []
        for row in range(128):
            channel = row % 64
            dt = delta[channel]
            decay = math.exp(dt * rates[row])
            driven = (1.0 - decay) * input_scale[row] * latent[channel]
            next_hidden.append(f32(math.tanh(decay * hidden[row] + driven + dt * projected[row] * 0.35)))
        hidden = next_hidden
        predicted = [f32(math.tanh(output_scale[channel] * hidden[channel]
                                   + output_scale[channel + 64] * hidden[channel + 64]
                                   + skip[channel] * latent[channel])) for channel in range(64)]
        reconstructed = [f32(math.tanh(0.85 * predicted[channel] + 0.35 * hidden[channel]))
                         for channel in range(64)]
        traces.append({"delta": delta, "actProj128": projected, "H": hidden[:],
                       "prevValidH": hidden[:], "predZ": predicted, "reconstructedStream64": reconstructed})
    return {"id": case["id"], "traces": traces}


def main():
    payload = json.load(sys.stdin, parse_constant=lambda value: (_ for _ in ()).throw(ValueError("Nonfinite JSON: " + value)))
    if payload.get("schema") != 1 or not isinstance(payload.get("cases"), list):
        raise ValueError("Unsupported comparison input schema")
    output = {"schema": 1, "runtime": {"python": platform.python_version(), "implementation": platform.python_implementation(),
              "platform": platform.platform(), "executable": sys.executable, "arithmetic": "Python binary64 with explicit binary32 stores and math.fsum dot products"},
              "cases": [evaluate(case) for case in payload["cases"]]}
    json.dump(output, sys.stdout, allow_nan=False, separators=(",", ":"))


if __name__ == "__main__":
    main()
