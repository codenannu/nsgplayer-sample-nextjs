import type { PlaygroundConfig, PlayIconPreset } from "../shared/playgroundConfig";

type Props = {
  value: PlaygroundConfig;
  onChange: (next: PlaygroundConfig) => void;
};

function Bool({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="field check">
      <input type="checkbox" checked={checked} onChange={onToggle} />
      {label}
    </label>
  );
}

export function RuntimeSettingsPanel({ value, onChange }: Props) {
  const patch = <K extends keyof PlaygroundConfig>(
    key: K,
    next: PlaygroundConfig[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <form
      className="settings"
      aria-label="Runtime player settings"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2>Runtime settings</h2>
      <p className="muted small">
        Changes apply live via <code>updateConfig</code> while playing.
      </p>

      <fieldset>
        <legend>Playback</legend>
        <Bool
          label="Autoplay"
          checked={value.autoplay}
          onToggle={() => patch("autoplay", !value.autoplay)}
        />
        <Bool
          label="Start muted"
          checked={value.startMuted}
          onToggle={() => patch("startMuted", !value.startMuted)}
        />
        <label className="field">
          Skip seconds
          <select
            value={value.skipSeconds}
            onChange={(e) =>
              patch("skipSeconds", Number(e.target.value) as 5 | 10 | 15 | 30)
            }
          >
            {[5, 10, 15, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Speed option count
          <input
            type="number"
            min={1}
            max={6}
            value={value.speedOptionCount}
            onChange={(e) =>
              patch("speedOptionCount", Math.min(6, Math.max(1, Number(e.target.value) || 1)))
            }
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Controls</legend>
        {(
          [
            ["showQuality", "Quality"],
            ["showSpeed", "Speed"],
            ["showCaptions", "Captions"],
            ["showVolume", "Volume"],
            ["showFullscreen", "Fullscreen"],
            ["showLive", "Live badge"],
            ["persistQualityPreference", "Persist quality"],
          ] as const
        ).map(([key, label]) => (
          <Bool
            key={key}
            label={label}
            checked={value[key]}
            onToggle={() => patch(key, !value[key])}
          />
        ))}
      </fieldset>

      <fieldset>
        <legend>Watermark</legend>
        <Bool
          label="Enabled"
          checked={value.watermarkEnabled}
          onToggle={() => patch("watermarkEnabled", !value.watermarkEnabled)}
        />
        <label className="field">
          Text
          <input
            value={value.watermarkText}
            onChange={(e) => patch("watermarkText", e.target.value)}
          />
        </label>
        <label className="field">
          Duration ms
          <input
            type="number"
            min={1000}
            step={1000}
            value={value.watermarkDurationMs}
            onChange={(e) =>
              patch("watermarkDurationMs", Number(e.target.value) || 1000)
            }
          />
        </label>
        <label className="field">
          Interval max ms
          <input
            type="number"
            min={0}
            step={1000}
            value={value.watermarkIntervalMaxMs}
            onChange={(e) =>
              patch("watermarkIntervalMaxMs", Number(e.target.value) || 0)
            }
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Theme</legend>
        <label className="field">
          Seek progress
          <input
            type="color"
            value={value.seekProgressColor}
            onChange={(e) => patch("seekProgressColor", e.target.value)}
          />
        </label>
        <label className="field">
          Control icons
          <input
            type="color"
            value={value.controlIconColor}
            onChange={(e) => patch("controlIconColor", e.target.value)}
          />
        </label>
        <label className="field">
          Play icon preset
          <select
            value={value.playIconPreset}
            onChange={(e) =>
              patch("playIconPreset", e.target.value as PlayIconPreset)
            }
          >
            <option value="triangle">triangle</option>
            <option value="circle">circle</option>
            <option value="roundedSquare">roundedSquare</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Accessibility</legend>
        <Bool
          label="Reduced motion"
          checked={value.reducedMotion}
          onToggle={() => patch("reducedMotion", !value.reducedMotion)}
        />
      </fieldset>
    </form>
  );
}
