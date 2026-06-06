export default function VaultItemCard({ item }: { item: Record<string, unknown> }) {
  return (
    <div>
      <pre>{JSON.stringify(item, null, 2)}</pre>
    </div>
  );
}
