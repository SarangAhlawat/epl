import { useEffect, useState } from "react";
import axios from "axios";

function App() {

  const [message, setMessage] =
    useState("");

  useEffect(() => {

    axios
      .get(
        "http://127.0.0.1:8000"
      )
      .then(res => {

        setMessage(
          res.data.message
        );

      });

  }, []);

  return (

    <div style={{
      padding: "40px"
    }}>

      <h1>
        Event Platform
      </h1>

      <p>
        {message}
      </p>

    </div>

  );

}

export default App;