export default function AuditLogItem({ log }: { log: Record<string, unknown> }) {
  return (
    <div>
      <pre>{JSON.stringify(log, null, 2)}</pre>
    </div>
  );
}
