import React from 'react';
import { Lightbulb } from 'lucide-react';

export default function GeminiFactCard({ fact }) {
  if (!fact) return null;

  return (
    <div className="fact-card">
      <h4 className="fact-card-title">
        <Lightbulb size={18} fill="#a78bfa" color="#a78bfa" />
        <span>Eco Fact Card</span>
      </h4>
      <p className="fact-card-body">
        {fact}
      </p>
    </div>
  );
}
