"use client";

import React, { useState, useEffect } from "react";
import { SiduriAvatar, SiduriAvatarState } from "@/components/SiduriAvatar";
import "./overlay.css";

const LINES: Record<string, string | null> = {
  idle: null,
  observing: "\u201cI am watching, Zagin.\u201d",
  listening: null,
  reasoning: "\u201cThere are several paths. I am weighing them.\u201d",
  investigating: "\u201cAllow me to consult the current records.\u201d",
  reading: "\u201cI have found the relevant material.\u201d",
  advising: "\u201cI recommend that you preserve your resources for now.\u201d",
  speaking: "\u201cYour current progress is sufficient, but the margin remains narrow.\u201d"
};

const LABELS: Record<string, string> = {
  idle: "Idle", observing: "Observing", listening: "Listening",
  reasoning: "Reasoning", investigating: "Investigating", reading: "Reading",
  advising: "Advising", speaking: "Speaking"
};

const STATE_ORDER = ["idle","observing","listening","reasoning","investigating","reading","advising","speaking"];

export default function OverlayPage() {
  const [previewBg, setPreviewBg] = useState(false);
  const [avatarState, setAvatarState] = useState<SiduriAvatarState>("idle");
  const [layer, setLayer] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setLayer(params.get('layer'));
  }, []);

  const subtitleText = LINES[avatarState];

  const showBase = layer === null || layer === "base";
  const showSiduri = layer === null || layer === "siduri";

  return (
    <div className={previewBg ? "preview-bg" : ""}>
      {/* subtle starfield, only visible when preview background is toggled on */}
      <div className="preview-stars" aria-hidden="true"></div>

      <div className="stage" id="stage" data-state={avatarState}>
        
        {/* BASE: decorative frame and context strip */}
        {showBase && (
          <>
            <div className="frame-brackets" aria-hidden="true">
              <div className="bracket-corner tl"><svg viewBox="0 0 46 46"><path d="M0 46 L0 18 L10 18 L10 10 L18 10 L18 0" fill="none" stroke="#cf9f56" strokeWidth="1.5"/></svg></div>
              <div className="bracket-corner tr"><svg viewBox="0 0 46 46"><path d="M0 46 L0 18 L10 18 L10 10 L18 10 L18 0" fill="none" stroke="#cf9f56" strokeWidth="1.5"/></svg></div>
              <div className="bracket-corner bl"><svg viewBox="0 0 46 46"><path d="M0 46 L0 18 L10 18 L10 10 L18 10 L18 0" fill="none" stroke="#cf9f56" strokeWidth="1.5"/></svg></div>
              <div className="bracket-corner br"><svg viewBox="0 0 46 46"><path d="M0 46 L0 18 L10 18 L10 10 L18 10 L18 0" fill="none" stroke="#cf9f56" strokeWidth="1.5"/></svg></div>
            </div>
            <div className="coord-lines" aria-hidden="true"></div>

            <section className="context-strip" aria-hidden="true">
              <div className="ctx-field">
                <span className="ctx-label">Active Domain</span>
                <span className="ctx-value">Blue Archive</span>
              </div>
              <span className="ctx-sep"></span>
              <div className="ctx-field">
                <span className="ctx-label">Task</span>
                <span className="ctx-value">Evaluating beginner progression</span>
              </div>
              <span className="ctx-sep"></span>
              <div className="ctx-field">
                <span className="ctx-label">Source</span>
                <span className="ctx-value">Screen + Web</span>
              </div>
            </section>
          </>
        )}

        {/* SIDURI: Siduri core: status label + Venus core with orbital rings */}
        {showSiduri && (
          <div className="siduri-core-area">
            <div className="status-block">
              <div className="status-glyph" aria-hidden="true">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" fill="none" stroke="#cf9f56" strokeWidth="1.4"/><line x1="12" y1="14" x2="12" y2="23" stroke="#cf9f56" strokeWidth="1.4"/><line x1="8" y1="19" x2="16" y2="19" stroke="#cf9f56" strokeWidth="1.4"/></svg>
              </div>
              <div className="status-name">Siduri</div>
              <div className="status-state">
                <span className="state-dot"></span>
                <span>{LABELS[avatarState]}</span>
              </div>
            </div>

            <div className="core-wrap flex items-center justify-center">
              <SiduriAvatar state={avatarState as SiduriAvatarState} size="presence" showMotes={true} />
            </div>
          </div>
        )}

        {/* BASE: subtitle: name label + spoken line */}
        {showBase && (
          <div className={`subtitle-panel ${subtitleText ? 'visible' : ''}`}>
            <div className="bracket bracket-tl"><svg viewBox="0 0 22 22"><path d="M0 22 L0 8 L8 0" fill="none" stroke="#cf9f56" strokeWidth="1.3"/></svg></div>
            <div className="subtitle-name">Siduri</div>
            <div className="subtitle-text">{subtitleText}</div>
            <div className="bracket bracket-br"><svg viewBox="0 0 22 22"><path d="M0 22 L0 8 L8 0" fill="none" stroke="#cf9f56" strokeWidth="1.3"/></svg></div>
          </div>
        )}

      </div>

    </div>
  );
}
