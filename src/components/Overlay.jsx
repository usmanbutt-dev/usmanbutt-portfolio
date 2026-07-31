import React from 'react';
import { Scroll } from '@react-three/drei';
import { motion } from 'framer-motion';

const projects = [
  {
    number: "01",
    name: "Pokédex App",
    stack: ["React Native", "Expo", "TypeScript", "PokéAPI"],
    problem: "Build a complete, production-quality mobile app — not a tutorial clone. The challenge was consuming a third-party API responsibly while delivering a polished, performant experience.",
  },
  {
    number: "02",
    name: "ArcSmith",
    stack: ["TypeScript", "React Flow", "Rust", "REST API"],
    problem: "Game writers and AI agents need a visual tool for branching narrative — a non-linear story graph editor that can be queried programmatically by external tools.",
  },
  {
    number: "03",
    name: "antigravity-unity",
    stack: ["C#", "Unity", "Editor Tooling"],
    problem: "Unity's built-in editor doesn't support modern AI-assisted coding environments. Developers working in Unity had no way to leverage the Google Antigravity IDE workflow.",
  }
];

const experience = [
  { company: "Termnl Tech", role: "Full-Stack & Mobile App Dev Intern | AI & RAG Engineer", period: "Jun 2026 — Present" },
  { company: "Axiolink Game Studio", role: "Head of Game Development", period: "Apr 2026 — Jun 2026" },
  { company: "AstroApe Studios", role: "Unity Developer", period: "Sep 2025 — Jun 2026" },
];

export default function Overlay() {
  return (
    <Scroll html style={{ width: '100%', height: '100%' }}>
      <div style={{ opacity: 0, pointerEvents: 'none' }}>
      {/* SECTION 1: HERO (0vh) */}
      <section style={{ height: '100vh', padding: '5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div>
          <span className="label">Full-Stack Engineer</span>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', margin: '1rem 0', lineHeight: 1.1, color: '#fff' }}>
            Muhammad<br />Usman Butt
          </h1>
          <p style={{ color: '#a1a1aa', maxWidth: '500px', fontSize: '1.2rem', lineHeight: 1.6 }}>
            I build production-grade web and mobile applications. 
            With a strong foundation in game development and interactive systems, 
            I now focus on full-stack engineering and AI-integrated products.
          </p>
        </div>
      </section>

      {/* SECTION 2: PROJECTS (100vh) */}
      <section style={{ height: '100vh', padding: '5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: '600px' }}>
          <span className="label">Selected Work</span>
          <h2 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem' }}>Projects</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {projects.map((p, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#60a5fa', fontFamily: 'monospace' }}>{p.number}</span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>{p.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {p.stack.map(s => <span key={s} className="tag">{s}</span>)}
                </div>
                <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>{p.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: EXPERIENCE (200vh) */}
      <section style={{ height: '100vh', padding: '5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right' }}>
        <div style={{ maxWidth: '600px' }}>
          <span className="label">Background</span>
          <h2 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem' }}>Experience</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {experience.map((e, i) => (
              <div key={i} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.9rem' }}>{e.period}</span>
                <h3 style={{ margin: '0.5rem 0', color: '#fff', fontSize: '1.4rem' }}>{e.company}</h3>
                <p style={{ color: '#a1a1aa', margin: 0 }}>{e.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: SKILLS / EDU (300vh) */}
      <section style={{ height: '100vh', padding: '5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ maxWidth: '600px' }}>
          <span className="label">Toolbox</span>
          <h2 style={{ fontSize: '3rem', color: '#fff', marginBottom: '2rem' }}>Skills & Education</h2>
          
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }}>
            <h3 style={{ color: '#f472b6', marginBottom: '1rem' }}>Frontend & Backend</h3>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>React, React Native, Astro, JavaScript, HTML/CSS<br/>Node.js, Rust, Python, C#</p>
            <h3 style={{ color: '#f472b6', margin: '1.5rem 0 1rem 0' }}>AI, ML & Tools</h3>
            <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>LangChain, RAG Pipelines, Qdrant, LLM Integration<br/>MongoDB, Firebase, Unity, Git</p>
          </div>
          
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>University of Management and Technology</h3>
            <p style={{ color: '#f472b6', margin: '0 0 1rem 0' }}>Bachelor of Science, Computer Science (Nov 2022 — Nov 2026)</p>
          </div>
        </div>
      </section>

      {/* SECTION 5: CONTACT (400vh) */}
      <section style={{ height: '100vh', padding: '5vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div>
          <span className="label">Get In Touch</span>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#fff', margin: '1rem 0 2rem 0' }}>Let's work together.</h2>
          <p style={{ color: '#a1a1aa', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '500px' }}>
            I'm currently open to full-stack engineering roles. Email is the best way to reach me.
          </p>
          
          <a href="mailto:buttu7666@gmail.com" style={{ 
            display: 'inline-block', 
            padding: '1rem 2.5rem', 
            background: '#fff', 
            color: '#000', 
            textDecoration: 'none', 
            borderRadius: '50px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            marginBottom: '2rem'
          }}>
            buttu7666@gmail.com
          </a>
          
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
            <a href="https://github.com/usmanbutt-dev" style={{ color: '#a1a1aa', textDecoration: 'none', fontFamily: 'monospace' }}>GitHub ↗</a>
            <a href="https://linkedin.com/in/usmanbutt-dev" style={{ color: '#a1a1aa', textDecoration: 'none', fontFamily: 'monospace' }}>LinkedIn ↗</a>
          </div>
        </div>
      </section>
      </div>
    </Scroll>
  );
}
