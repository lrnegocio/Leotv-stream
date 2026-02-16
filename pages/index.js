import { useEffect, useState } from "react";
import { db } from "../firebaseConfig"; // importa o Firestore
import { collection, getDocs } from "firebase/firestore";

export default function Home() {
  const [canais, setCanais] = useState([]);

  useEffect(() => {
    async function listarCanais() {
      try {
        const canaisCol = collection(db, "canais");
        const snapshot = await getDocs(canaisCol);
        setCanais(snapshot.docs.map(doc => doc.data()));
      } catch (error) {
        console.error("Erro ao carregar canais:", error);
      }
    }
    listarCanais();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Canais Disponíveis</h1>
      <ul>
        {canais.map((canal, i) => (
          <li key={i}>
            <a href={canal.link} target="_blank" rel="noopener noreferrer">
              {canal.nome}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
