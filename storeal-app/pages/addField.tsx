import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useRouter } from "next/router";
import { Button, Input, Table } from "reactstrap";
import React, { useEffect, useState } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import axios from "axios";
import ContractABI from "../../artifacts/contracts/Storeal.sol/Storage.json";

export default function AddFields() {
  const router = useRouter();
  let [counter, setCounter] = useState(1);
  let [counterPermission, setCounterPermission] = useState(1);
  const [response, setResponse] = useState();
  const { address } = useAccount()
  const { config } = usePrepareContractWrite({
    address: "0x88DCa61727F991d2C6E7053d7F650283aD01d61D",
    abi: ContractABI.abi,
    functionName: 'writeData',
    // args: [response.data.uuid, response.data.hash],
    args: ["16", "QmepzLpHSM6vmFFfb7LS28RBMXbCHMFNdax23NgxSyVoSv"],
  })
  const { data, write } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const [formData, setFormData] = useState({});
  const [formDataWithPerm, setFormDataWithPerm] = useState({});


  const handleAddFieldClick = () => {
    setCounter(counter++);
  };

  const handleAddPermissionClick = () => {
    setCounterPermission(counterPermission++);
  };

  useEffect(() => {
    renderFields();
  }, [counter]);

  // useEffect(() => contractCall(""),[]);

  // useEffect(() => {response && contractCall(response)}, [response]);

  const handleSubmit = () => {
    const data = {};
    for (let i = 0; i < counter; i++) {
      const key = document.getElementsByName(`textbox-${i}-key`)[0].value;
      const value = document.getElementsByName(`textbox-${i}-value`)[0].value;
      data[key] = value;
    }
    setFormData(data);
  };

  const handlePermissions = () => {
    const data = {};
    for (let i = 0; i < counter; i++) {
      const address = document.getElementsByName(`textbox-${i}-address`)[0]?.value;
      const permission = document.getElementsByName(`textbox-${i}-permission`)[0]?.value;
      data[address] = permission;
    }
    const dataArr = []
    dataArr.push(formData);
    dataArr.push(data);
    dataArr.push({ "address": address });
    // console.log(JSON.stringify([...formData, ...data]));
    setFormDataWithPerm(dataArr);
    axios.post("http://localhost:6545/x/write", dataArr)
      .then(response => {
        console.log("Response:", response.data);

        contractCall();
      })
      .catch(error => {
        console.error("Error:", error);
      });

  };

  const contractCall = () => {
    write?.();
    console.log(data);
    console.log(isLoading, isSuccess);
  }

  useEffect(() => console.log(formDataWithPerm), [formDataWithPerm])

  const renderFields = () => {
    const fields = [];
    for (let i = 0; i < counter; i++) {
      fields.push(
        <tr key={i}>
          <td>
            <Input type="text" name={`textbox-${i}-key`} placeholder="Key" />
          </td>
          <td>
            <Input type="text" name={`textbox-${i}-value`} placeholder="Value" />
          </td>
        </tr>
      );
    }
    return fields;
  };

  const renderPermissionFields = () => {
    const fields = [];
    for (let i = 0; i < counterPermission; i++) {
      fields.push(
        <tr key={i}>
          <td>
            <Input type="text" name={`textbox-${i}-address`} placeholder="Address" />
          </td>
          <td>
            <Input type="text" name={`textbox-${i}-permission`} placeholder="Permission" />
          </td>
        </tr>
      );
    }
    return fields;
  };

  return (
    <>
      <Head>
        <title>Storeal App</title>
        <meta
          content="Generated by @rainbow-me/create-rainbowkit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <header className={styles.header}>
        <h1>STOREAL</h1>
        <p id="center">Distributed Database As A Service</p>
      </header>

      <Button style={{ padding: 10 }} onClick={handleAddFieldClick}>
        Add Field
      </Button>
      <Table>{renderFields().map((field, index) => (
        <React.Fragment key={index}>{field}</React.Fragment>
      ))}</Table>
      <Button style={{ padding: 10 }} onClick={handleSubmit}>
        Create Payload
      </Button>
      <div>{JSON.stringify(formData)}</div>

      <br></br>
      <Button style={{ padding: 10 }} onClick={handleAddPermissionClick}>
        Add Permissions
      </Button>
      <Table>{renderPermissionFields().map((field, index) => (
        <React.Fragment key={index}>{field}</React.Fragment>
      ))}</Table>
      <Button style={{ padding: 10 }} onClick={() => contractCall("")}>
        Submit
      </Button>
      <div>{JSON.stringify(formDataWithPerm)}</div>
    </>
  );
}
