
export default function RoadsPage() {
  return (
    <div className="card">
      <h1 className="font-semibold mb-2">roads — cdot</h1>
      <p className="text-sm">
        CDOT closures/incidents and cameras will appear here once we add your CDOT API key and endpoints.
      </p>
      <ol className="text-sm list-decimal ml-5 mt-2">
        <li>Request your CDOT Traveler API key</li>
        <li>We’ll paste the endpoints into route handlers and render a list + camera grid</li>
      </ol>
    </div>
  );
}
