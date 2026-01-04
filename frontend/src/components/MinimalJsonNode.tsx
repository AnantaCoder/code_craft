export default function MinimalJsonNode({ data }: { data: any }) {
    if (typeof data !== "object" || data === null) {
        return <span className="text-green-600">{String(data)}</span>;
    }

    return (
        <ul className="pl-4 border-l">
            {Object.entries(data).map(([key, value]) => (
                <li key={key}>
                    <strong>{key}:</strong>
                    <MinimalJsonNode data={value} />
                </li>
            ))}
        </ul>
    );
}
