import React, { useState } from "react";
import "./App.css";
import { loadUGESong, saveUGESong } from "shared/lib/uge/ugeHelper";
import { migrateUGE } from "migrate";

interface MigratedFile {
  filename: string;
  url: string;
}

interface MigratedError {
  filename: string;
  message: string;
}

function App() {
  const [migratedFiles, setMigratedFiles] = useState<MigratedFile[]>([]);
  const [errors, setErrors] = useState<MigratedError[]>([]);

  const migrateFile = (file: File): Promise<MigratedFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);

      reader.onload = function (event) {
        try {
          if (!event.target) {
            return reject("No target found in FileReader");
          }
          const arrayBuffer = event.target.result;
          if (!arrayBuffer || typeof arrayBuffer === "string") {
            return reject("FileReader didn't get an ArrayBuffer");
          }

          const song = loadUGESong(arrayBuffer);

          if (!song) {
            return reject("Unable to load UGESong data");
          }

          const output = saveUGESong(migrateUGE(song));

          const blob = new Blob([output], {
            type: "application/octet-stream",
          });

          const url = window.URL.createObjectURL(blob);

          resolve({
            filename: file.name,
            url,
          });
        } catch (e) {
          if (e instanceof Error) {
            return reject(e.message);
          }
          return reject("Unknown error");
        }
      };

      // If an error occurs during reading
      reader.onerror = function (event) {
        reject("File could not be read: " + event.target?.error);
      };
    });
  };

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target || !event.target.files) {
      return;
    }
    const files = event.target.files;
    const newMigratedFiles = [...migratedFiles];
    const newErrors = [...errors];
    for (let i = 0; i < files.length; i++) {
      try {
        newMigratedFiles.push(await migrateFile(files[i]));
      } catch (e) {
        newErrors.push({
          filename: files[i].name,
          message: String(e),
        });
        console.error(e);
      }
    }
    setMigratedFiles(newMigratedFiles);
    setErrors(newErrors);
    event.target.value = "";
  };

  return (
    <div className="App">
      <header>
        <h1>GB Studio .uge Migrator</h1>
        <p>
          GB Studio 3.2.1 and below had an issue where wave instrument lengths
          were being saved in a way that was incompatible with{" "}
          <a href="https://github.com/SuperDisk/hUGETracker">hUGETracker</a>.
          From 3.3.0 onwards this issue has been fixed but <strong>.uge</strong>{" "}
          files created with older GB Studio versions may not sound correct if
          you have set length values on your wave instruments.
        </p>
        <p>
          This tool fixes your old GB Studio .uge files so they are ready for
          3.3.0 and above.
        </p>
      </header>
      <div className="App__Columns">
        <div className="App__UploadBtn">
          <h2>Drop .uge files here.</h2>
          <input
            type="file"
            multiple
            accept=".uge,.UGE"
            onChange={onUpload}
            title="Choose some .UGE files to migrate"
          />
        </div>

        <div className="App__List">
          {migratedFiles.map((file, index) => (
            <a
              key={`${file.filename}_${index}`}
              href={file.url}
              download={file.filename}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path d="M13.744 8s1.522-8-3.335-8h-8.409v24h20v-13c0-3.419-5.247-3.745-8.256-3zm2.255 8.852c-.003 1.684-2.484 2.059-2.925.812-.333-.945.797-1.947 1.926-1.725v-2.912l-4.001.955v3.469c-.001 1.682-2.5 2.059-2.94.811-.334-.944.813-1.948 1.941-1.723v-4.344l5.999-1.195v5.852zm-1.431-16.777c2.202 1.174 5.938 4.883 7.432 6.881-1.286-.9-4.044-1.657-6.091-1.179.222-1.468-.185-4.534-1.341-5.702z" />
              </svg>

              {file.filename}
            </a>
          ))}
          {errors.map((error, index) => (
            <div key={index} className="App__List__Error">
              <svg
                clipRule="evenodd"
                fillRule="evenodd"
                strokeLinejoin="round"
                strokeMiterlimit="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  width: 20,
                  height: 20,
                  fill: "#fff",
                  marginRight: 10,
                }}
              >
                <path
                  d="m2.095 19.886 9.248-16.5c.133-.237.384-.384.657-.384.272 0 .524.147.656.384l9.248 16.5c.064.115.096.241.096.367 0 .385-.309.749-.752.749h-18.496c-.44 0-.752-.36-.752-.749 0-.126.031-.252.095-.367zm9.907-6.881c-.414 0-.75.336-.75.75v3.5c0 .414.336.75.75.75s.75-.336.75-.75v-3.5c0-.414-.336-.75-.75-.75zm-.002-3c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1z"
                  fillRule="nonzero"
                />
              </svg>
              {error.filename}: {error.message}
            </div>
          ))}
          {migratedFiles.length === 0 && errors.length === 0 && (
            <div className="App__List__EmptyMsg">
              Migrated files will be here.
            </div>
          )}

          {(migratedFiles.length > 0 || errors.length > 0) && (
            <>
              <div className="FlexSpacer" />
              <div
                className="App__List__ResetBtn"
                onClick={() => {
                  setMigratedFiles([]);
                  setErrors([]);
                }}
              >
                Reset
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
