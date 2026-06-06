export default function StrengthMeter({ score }: { score: number }) {
  return (
    <div>
      <div style={{ width: `${score}%`, height: 8, background: "green" }} />
    </div>
  );
}
