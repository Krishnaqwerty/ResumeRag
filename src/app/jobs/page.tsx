export default function JobsPage() {
  return <div>
    <h1>Jobs</h1>
    <form>
      <input type="text" name="title" placeholder="Title" />
      <textarea name="description" placeholder="Description" />
      <textarea name="requirements" placeholder="One requirement per line" />
      <button type="submit">Create</button>
    </form>
  </div>;
}
