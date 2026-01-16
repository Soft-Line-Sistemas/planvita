"use strict";

import axios from "axios";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Backend URL - trying HTTPS as per previous success
const BASE_URL = "https://localhost:61348/api/v1";
const CPF = "03846514535"; // CPF normalizado

async function test() {
  console.log(
    "--- Testing without X-Tenant header (relying on Host: localhost:61348) ---",
  );
  try {
    const response = await axios.get(`${BASE_URL}/titular/public/search`, {
      params: { cpf: CPF },
    });
    console.log("Success (No X-Tenant):", response.status, response.data?.nome);
  } catch (error) {
    console.error("Error (No X-Tenant):", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Code:", error.code);
    }
  }

  console.log("\n--- Testing WITH X-Tenant: localhost ---");
  try {
    const response = await axios.get(`${BASE_URL}/titular/public/search`, {
      params: { cpf: CPF },
      headers: { "X-Tenant": "localhost" },
    });
    console.log(
      "Success (With X-Tenant):",
      response.status,
      response.data?.nome,
    );
  } catch (error) {
    console.error("Error (With X-Tenant):", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Code:", error.code);
    }
  }
}

test();
