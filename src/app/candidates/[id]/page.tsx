interface Props { params: { id: string } }
export default function CandidatePage({ params }: Props) {
  return <div>
    <h1>Candidate {params.id}</h1>
    <p>Details loading client-side...</p>
  </div>;
}
