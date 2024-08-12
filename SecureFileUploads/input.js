import { fileTypeFromBlob } from "file-type";

const [file, setFile] = useState({ file: null, name: "", randName: "" });

<input
  type="file"
  id="upload"
  // Set an allow list of file types
  accept=".csv, .doc, .docx, .gif, .jpeg, .jpg, .mp3, .mp4, .pdf, .png, .ppt, .pptx, .txt, .xls, .xlsx, .xml"
  onChange={async (e) => {
    const maxFileSize = 1048576 * 20; // 20MB
    if (e.target.files) {
      const currFile = e.target.files[0];

      // Check if file is too big
      if (e.target.files[0].size > maxFileSize) {
        alert("File is too big");
        e.target.value = "";
        return;
      }

      // Check the file extension and MIME type
      const exten = currFile.name.split(".").pop();
      const type = await fileTypeFromBlob(file.slice(0, 100));
      if (!currFile.name.includes(".") || mimeTypes[exten] != type) {
        alert("File extension does not match file type");
        e.target.value = "";
        return;
      }

      /* On the backend, we will refer to the file by randName, 
         but we can still store and display its original name when we retrieve it
      */
      setFile({
        file: currFile,
        name: currFile.name,
        randName: crypto.randomUUID(),
      });
    }
  }}
/>;
