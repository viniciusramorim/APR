import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  Select,
  MenuItem,
  Button,
  InputLabel,
  FormControl,
  Typography,
} from "@mui/material";
import Header from "../Header";
import { v4 as uuidv4 } from "uuid";

const InsertQuestions = () => {
  const [checklists, setChecklists] = useState([]);
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [file, setFile] = useState(null);
  const firebase = getFirestore();

  useEffect(() => {
    const fetchChecklists = async () => {
      const questionCollectionRef = collection(firebase, "question");
      const questionSnapshot = await getDocs(questionCollectionRef);
      const checklists = questionSnapshot.docs.map((doc) => doc.id);
      setChecklists(checklists);
    };
    fetchChecklists();
  }, [firebase]);

  const handleChecklistChange = async (e) => {
    const checklist = e.target.value;
    setSelectedChecklist(checklist);

    const checklistDocRef = doc(firebase, "question", checklist);
    const checklistSnap = await getDoc(checklistDocRef);
    if (checklistSnap.exists()) {
      const data = checklistSnap.data();
      setBlocks(Object.keys(data));
    }
  };

  const handleBlockChange = (e) => {
    setSelectedBlock(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !selectedChecklist || !selectedBlock) {
      alert("Selecione o checklist, bloco e um arquivo para continuar.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const formattedQuestions = jsonData.map((row) => {
        return {
          question: row["question"] || "",
          answers: row["answers"]
            ? row["answers"].split(",").map((ans) => ans.trim())
            : [],
          area: selectedBlock,
          areaResponsavel: row["areaResponsavel"]
            ? row["areaResponsavel"].split(" ").map((arr) => arr.trim())
            : [],
          critical: row["critical"]
            ? row["critical"].split(",").map((crt) => crt.trim())
            : [],
          images: row["images"] === "true",
          inputImagesLibrary: row["inputImagesLibrary"] === "true",
          peso: row["peso"] ? parseFloat(row["peso"]) : 0,
          peso_daef: row["peso_daef"] ? parseFloat(row["peso_daef"]) : 0,
          peso_fmc: row["peso_fmc"] ? parseFloat(row["peso_fmc"]) : 0,
          peso_icd: row["peso_icd"] ? parseFloat(row["peso_icd"]) : 0,
          peso_rct: row["peso_rct"] ? parseFloat(row["peso_rct"]) : 0,
          plano_acao: {
            question: row["plano_acao"] || "",
          },
          questionId: uuidv4(),
          resp: row["resp"] || "",
          respGabarito: row["respGabarito"] || "",
          respTextArea: row["respTextArea"] || "",
          optionList: row["optionList"]
            ? row["optionList"].split(",").map((opt) => opt.trim())
            : [],
          textarea: row["textarea"] === "true",
          status: row["status"] === "true",
          selectOptions: row["selectOptions"] === "true",
          inputImages: row["inputImages"] === "true",
          inputNumber: row["inputNumber"] === "true",
          listCheck: row["listCheck"] === "true",
          openPA: row["openPA"] === "true",
          valorArmazenado: {
            max:
              row["valorArmazenadoMax"] && !isNaN(row["valorArmazenadoMax"])
          ? parseFloat(row["valorArmazenadoMax"])
          : 0,
            min:
              row["valorArmazenadoMin"] && !isNaN(row["valorArmazenadoMin"])
          ? parseFloat(row["valorArmazenadoMin"])
          : 0,
          },
          subir: true,
        };
      });

      const checklistDocRef = doc(firebase, "question", selectedChecklist);
      const checklistSnap = await getDoc(checklistDocRef);
      if (checklistSnap.exists()) {
        const data = checklistSnap.data();
        const updatedBlock = data[selectedBlock] || [];
        updatedBlock.push(...formattedQuestions);

        await updateDoc(checklistDocRef, {
          [selectedBlock]: updatedBlock,
        });
        alert("Perguntas inseridas com sucesso!");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <Header />
      <div className="content">
        <Typography sx={{ paddingTop: "30px" }} variant="h4">
          Upload perguntas
        </Typography>
        <FormControl fullWidth margin="normal">
          <InputLabel>Checklist</InputLabel>
          <Select value={selectedChecklist} onChange={handleChecklistChange}>
            {checklists.map((checklist) => (
              <MenuItem key={checklist} value={checklist}>
                {checklist}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal" disabled={!selectedChecklist}>
          <InputLabel>Bloco</InputLabel>
          <Select value={selectedBlock} onChange={handleBlockChange}>
            {blocks.map((block) => (
              <MenuItem key={block} value={block}>
                {block}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" component="label">
          Upload XLSX
          <input
            type="file"
            hidden
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          style={{ marginLeft: "10px" }}
        >
          Inserir Perguntas
        </Button>
      </div>
    </div>
  );
};

export default InsertQuestions;
