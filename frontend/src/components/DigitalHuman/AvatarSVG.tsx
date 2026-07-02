import React from 'react';

export type AiraState =
  | 'idle' | 'greeting' | 'talking' | 'thinking'
  | 'celebrating' | 'pointing' | 'stretching'
  | 'reading' | 'dancing' | 'shrugging';

interface AvatarSVGProps {
  state: AiraState;
  isDragging?: boolean;
  size?: number;
  onClick?: () => void;
}

export const AvatarSVG: React.FC<AvatarSVGProps> = ({ state, isDragging = false, size = 130, onClick }) => {
  const stateClass = `dh-state-${state}`;
  const h = size;
  const w = size * 0.65;

  return (
    <div
      className={`dh-avatar-wrap ${stateClass}`}
      onClick={onClick}
      style={{ width: w, height: h, position: 'relative', userSelect: 'none', touchAction: 'none' }}
      title={isDragging ? 'Drag to move Aira' : 'Aira — Click to chat'}
    >
      {/* Inner wrapper — this gets the grab-lean transform during drag */}
      <div
        className="dh-avatar-inner"
        style={{
          width: '100%', height: '100%',
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          transform: isDragging ? 'rotate(-6deg) scale(1.05)' : 'none',
          filter: isDragging ? 'drop-shadow(0 14px 28px rgba(99,102,241,0.5))' : 'none',
        }}
      >
        <svg
          viewBox="0 0 80 150"
          width={w}
          height={h}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible', display: 'block' }}
        >
          {/* Shadow */}
          <ellipse cx="40" cy="148" rx={isDragging ? 28 : 22} ry={isDragging ? 5 : 4}
            fill="rgba(0,0,0,0.12)" style={{ transition: 'all 0.2s' }} />

          {/* ── BODY GROUP ─────────────────────── */}
          <g className="dh-body-group">
            {/* Jacket */}
            <rect x="22" y="75" width="36" height="44" rx="6" fill="#1e3a8a" />
            {/* Lapel left */}
            <polygon points="40,77 28,77 28,95 38,83" fill="#1e40af" opacity="0.6" />
            {/* Lapel right */}
            <polygon points="40,77 52,77 52,95 42,83" fill="#1e40af" opacity="0.6" />
            {/* Shirt */}
            <rect x="35" y="72" width="10" height="12" rx="2" fill="#f8fafc" />
            {/* Tie */}
            <polygon points="40,78 37.5,86 40,100 42.5,86" fill="#7c3aed" />
            <rect x="38.2" y="76" width="3.6" height="4.5" rx="1.2" fill="#5b21b6" />

            {/* Left Arm */}
            <g className="dh-arm-left">
              <rect x="9" y="76" width="13" height="36" rx="6.5" fill="#1e3a8a" />
              <ellipse cx="15.5" cy="115" rx="6.5" ry="7.5" fill="#c9956a" />
              {/* fingers */}
              <ellipse cx="12" cy="120" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
              <ellipse cx="15.5" cy="121.5" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
              <ellipse cx="19" cy="120" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
            </g>

            {/* Right Arm */}
            <g className="dh-arm-right">
              <rect x="58" y="76" width="13" height="36" rx="6.5" fill="#1e3a8a" />
              <ellipse cx="64.5" cy="115" rx="6.5" ry="7.5" fill="#c9956a" />
              <ellipse cx="61" cy="120" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
              <ellipse cx="64.5" cy="121.5" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
              <ellipse cx="68" cy="120" rx="2.5" ry="1.5" fill="#b8804f" opacity="0.7" />
            </g>

            {/* Legs */}
            <g className="dh-legs-group">
              <rect x="26" y="117" width="12" height="30" rx="5.5" fill="#1e293b" />
              <rect x="42" y="117" width="12" height="30" rx="5.5" fill="#1e293b" />
              {/* Shoes */}
              <ellipse cx="32" cy="148" rx="10" ry="4" fill="#0f172a" />
              <ellipse cx="48" cy="148" rx="10" ry="4" fill="#0f172a" />
              {/* Shoe shine */}
              <ellipse cx="29" cy="147" rx="3" ry="1.5" fill="white" opacity="0.12" />
              <ellipse cx="45" cy="147" rx="3" ry="1.5" fill="white" opacity="0.12" />
            </g>
          </g>

          {/* ── HEAD GROUP ──────────────────────── */}
          <g className="dh-head-group">
            {/* Neck */}
            <rect x="33.5" y="63" width="13" height="15" rx="5" fill="#c9956a" />

            {/* Head */}
            <ellipse cx="40" cy="44" rx="22" ry="24" fill="#d4a574" />
            {/* Face glow */}
            <ellipse cx="40" cy="48" rx="17" ry="19" fill="#daa55a" opacity="0.22" />

            {/* Hair */}
            <g className="dh-hair-group">
              <ellipse cx="40" cy="26" rx="22" ry="14" fill="#2d1507" />
              <ellipse cx="40" cy="15" rx="13" ry="11" fill="#2d1507" />
              <ellipse cx="40" cy="13" rx="9" ry="8" fill="#4b2e14" />
              {/* Hair strand details */}
              <path d="M27 20 Q24 28 18 44" stroke="#2d1507" strokeWidth="4" fill="none" />
              <path d="M53 20 Q56 28 62 44" stroke="#2d1507" strokeWidth="4" fill="none" />
            </g>

            {/* Eyebrows */}
            <path d="M27 37 Q31.5 33.5 36 36" stroke="#2d1507" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M44 36 Q48.5 33.5 53 37" stroke="#2d1507" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Eye whites */}
            <ellipse cx="31.5" cy="44" rx="6.5" ry="6.5" fill="white" />
            <ellipse cx="48.5" cy="44" rx="6.5" ry="6.5" fill="white" />

            {/* Pupils (look-around) */}
            <g className="dh-pupils-group">
              <ellipse cx="31.5" cy="44" rx="3.2" ry="3.2" fill="#1a1a2e" />
              <ellipse cx="32.7" cy="42.8" rx="1.1" ry="1.1" fill="white" opacity="0.85" />
              <ellipse cx="48.5" cy="44" rx="3.2" ry="3.2" fill="#1a1a2e" />
              <ellipse cx="49.7" cy="42.8" rx="1.1" ry="1.1" fill="white" opacity="0.85" />
            </g>

            {/* Eyelids (blink) */}
            <g className="dh-eye">
              <ellipse cx="31.5" cy="43.5" rx="6.5" ry="6.5" fill="#d4a574" />
              <path d="M25 43.5 Q31.5 38 38 43.5" fill="#2d1507" opacity="0.7" />
            </g>
            <g className="dh-eye dh-eye-r">
              <ellipse cx="48.5" cy="43.5" rx="6.5" ry="6.5" fill="#d4a574" />
              <path d="M42 43.5 Q48.5 38 55 43.5" fill="#2d1507" opacity="0.7" />
            </g>

            {/* Nose */}
            <ellipse cx="40" cy="52" rx="2.8" ry="2.2" fill="#b8884d" opacity="0.55" />
            <path d="M37.2 53.5 Q40 55.5 42.8 53.5" stroke="#b8884d" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.5" />

            {/* Cheek blush */}
            <ellipse cx="24.5" cy="52.5" rx="5.5" ry="3.5" fill="#e57373" opacity="0.16" />
            <ellipse cx="55.5" cy="52.5" rx="5.5" ry="3.5" fill="#e57373" opacity="0.16" />

            {/* Mouth */}
            <g className="dh-mouth">
              <path d="M33 59.5 Q40 65.5 47 59.5" stroke="#8b4513" strokeWidth="2" fill="none" strokeLinecap="round" />
              <ellipse cx="40" cy="62" rx="5" ry="2.8" fill="#7c3f0a" opacity="0.14" />
            </g>

            {/* Earrings */}
            <circle cx="17.5" cy="50" r="3" fill="#f59e0b" />
            <circle cx="17.5" cy="54" r="2" fill="#fbbf24" opacity="0.7" />
            <circle cx="62.5" cy="50" r="3" fill="#f59e0b" />
            <circle cx="62.5" cy="54" r="2" fill="#fbbf24" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Status dot */}
      <div className="dh-status-dot" />
    </div>
  );
};
