export default function UploadPage() {
  return <div>
    <h1>Upload Resumés</h1>
    <form>
      <input type="file" name="files" multiple />
      <button type="submit">Upload</button>
    </form>
  </div>;
}
