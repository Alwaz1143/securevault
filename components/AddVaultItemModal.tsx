export default function AddVaultItemModal({ onClose }: { onClose: () => void }) {
  return (
    <div>
      <h2>Add Vault Item</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
}
