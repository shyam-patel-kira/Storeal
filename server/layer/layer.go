package layer

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"
	"mime/multipart"
	"net/http"
	"reflect"
	"strconv"

	// "github.com/collinglass/bptree"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/gorilla/mux"
)

type KV struct {
	KeyName string `json:"key"`
	Value   string `json:"value"`
}

type IPFSOut struct {
	Name string `json:"name"`
	Hash string `json:"hash"`
	Size string `json:"size"`
}

type WriteResp struct {
	UUID int    `json:"uuid"`
	CID  string `json:"hash"`
}

// key - uuid, value - permissions json string
var kv_MAP = make(map[int]map[string]interface{})
var decrypt_MAP = make(map[int]string)
var user_documentuuid = make(map[string][]int)

var KVPairs []KV

var ipfsOut IPFSOut

// var t = bptree.NewTree()

var i int = 1

func contains(uuids []int, uuid int) bool {
	for _, v := range uuids {
		if v == uuid {
			return true
		}
	}
	return false
}

func InsertData(w http.ResponseWriter, r *http.Request, config Config) {
	uuid := i
	fmt.Println("Insert Data Endpoint Hit")
	vars := mux.Vars(r)
	username := vars["username"]
	reqBody, _ := ioutil.ReadAll(r.Body)
	fmt.Println(string(reqBody))

	var KVpairs []map[string]interface{}
	var fieldKVpairs []map[string]interface{}
	var permissionsKVPair []map[string]interface{}
	if err := json.Unmarshal(reqBody, &KVpairs); err != nil {
		log.Fatal(err)
	}
	for i := 0; i < len(KVpairs); i++ {
		if _, ok := KVpairs[i]["read"]; !ok {
			fieldKVpairs = append(fieldKVpairs, KVpairs[i])
		} else {
			permissionsKVPair = append(permissionsKVPair, KVpairs[i])
		}
	}

	// [{"a":"value1", "b": "value2"}, {"read": ["user1", "user2"], "write": ["user1"]}]

	uuid = 1
	hash := "hash"
	encryptKey := "encryptKey"
	// uuid, hash, encryptKey := InsertInIPFS(fieldKVpairs, uuid, config)
	decrypt_MAP[uuid] = encryptKey
	// go InsertInTree(uuid, hash)

	if !contains(user_documentuuid[username], uuid) {
		user_documentuuid[username] = append(user_documentuuid[username], uuid)
	}
	kv_MAP[uuid] = KVpairs[1]
	read_peeps := reflect.ValueOf(permissionsKVPair[0]["read"])
	write_peeps := reflect.ValueOf(permissionsKVPair[0]["write"])
	for i := 0; i < read_peeps.Len(); i++ {
		val, ok := read_peeps.Index(i).Interface().(string)
		if !ok {
			// handle type assertion error
		}
		if !contains(user_documentuuid[val], uuid) {
			user_documentuuid[val] = append(user_documentuuid[val], uuid)
		}
	}
	for i := 0; i < write_peeps.Len(); i++ {
		val, ok := read_peeps.Index(i).Interface().(string)
		if !ok {
			// handle type assertion error
		}
		if !contains(user_documentuuid[val], uuid) {
			user_documentuuid[val] = append(user_documentuuid[val], uuid)
		}
	}
	resp := WriteResp{
		UUID: uuid,
		CID:  hash,
	}
	json.NewEncoder(w).Encode(resp)
	i++
}

func FetchData(w http.ResponseWriter, r *http.Request, config Config) {
	vars := mux.Vars(r)
	key := vars["uuid"]
	keyInt, _ := strconv.Atoi(key)
	// hash, err := SearchInTree(keyInt)
	// if err != nil {
	// 	panic(err)
	// }

	// get hash from blockchain
	hash := ""

	out := FetchFromIPFS(hash, decrypt_MAP[keyInt], config)
	w.Write([]byte(out))
}

func InsertInIPFS(data []map[string]interface{}, uid int, config Config) (int, string, string) {
	encryptKey, hash := EncryptData(data, config)
	return uid, hash, encryptKey
}
func FetchDataByUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	// x := strings.Trim(strings.Join(strings.Fields(fmt.Sprint(user_documentuuid[username])), ","), "[]")
	json.NewEncoder(w).Encode(user_documentuuid[username])
}

func EncryptData(data []map[string]interface{}, config Config) (string, string) {
	jsonStr, err := json.Marshal(data)
	fmt.Println(jsonStr)
	fmt.Println(string(jsonStr))
	if err != nil {
		return "", ""
	}
	encrypted_data, key := encrypt_string(string(jsonStr))
	hash := write_to_ipfs(encrypted_data, config)
	return key, hash
}

func write_to_ipfs(data string, config Config) string {

	url := config.API_ENDPOINT_UPLOAD
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "matrix.json")
	if err != nil {
		fmt.Println(err)
		return ""
	}
	part.Write([]byte(data))
	writer.Close()
	request, err := http.NewRequest("POST", url, body)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	request.Header.Set("Content-Type", writer.FormDataContentType())
	if config.AUTH {
		request.Header.Set("Authorization", "Bearer "+config.KEY)
	}
	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		fmt.Println(err)
		return ""
	}
	defer response.Body.Close()
	bodyBytes, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return ""
	}

	json.Unmarshal(bodyBytes, &ipfsOut)
	return ipfsOut.Hash

}

func FetchFromIPFS(hash string, key string, config Config) string {
	in_data := get_from_ipfs(hash, key, config)
	return in_data
}

func get_from_ipfs(hash string, key string, config Config) string {
	url := fmt.Sprintf(config.API_ENDPINT_GET, hash)
	method := config.METHOD
	payload := &bytes.Buffer{}

	req, err := http.NewRequest(method, url, payload)

	if err != nil {
		// handle error
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	if config.AUTH {
		req.Header.Add("Authorization", "Bearer "+config.KEY)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		// handle error
	}
	defer res.Body.Close()

	body, err := ioutil.ReadAll(res.Body)
	if err != nil {
		// handle error
	}
	c_text := string(body)
	return decrypt_string(c_text, key)
}

// func InsertInTree(uuid int, value string) {
// 	val := []byte(value)
// 	err := t.Insert(uuid, val)
// 	if err != nil {
// 		fmt.Printf("error while inserting in a tree: %s\n\n", err)
// 	}
// }

// func SearchInTree(key int) (string, error) {
// 	value, err := t.Find(key, true)
// 	if err != nil {
// 		fmt.Printf("error: %s\n\n", err)
// 		return "", err
// 	}
// 	return string(value.Value), nil
// }

func pad(plaintext []byte, blockSize int) []byte {
	padding := blockSize - len(plaintext)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(plaintext, padtext...)
}

func unpad(padded []byte) []byte {
	padding := int(padded[len(padded)-1])
	return padded[:len(padded)-padding]
}

func encrypt_string(plain_text string) (string, string) {
	key := []byte(generate_key())
	block, err := aes.NewCipher(key)
	if err != nil {
		fmt.Println("Error:", err)
		panic(err)
	}
	fmt.Println("##########")
	fmt.Println(plain_text)

	// The IV should be unique for each encryption
	iv := make([]byte, aes.BlockSize)
	if _, err := rand.Read(iv); err != nil {
		panic(err)
	}

	mode := cipher.NewCBCEncrypter(block, iv)
	padded := pad([]byte(plain_text), aes.BlockSize)
	ciphertext := make([]byte, len(padded))
	fmt.Println("!!!!!!!!")
	fmt.Println(ciphertext)
	mode.CryptBlocks(ciphertext, padded)

	// Encode the IV and ciphertext as a hex string for storage
	encoded := hex.EncodeToString(append(iv, ciphertext...))
	return encoded, string(key)
}

func decrypt_string(cipher_text string, key string) string {
	ciphertext, err := hex.DecodeString(cipher_text)
	fmt.Println("##########")
	fmt.Println(ciphertext)
	if err != nil {
		panic(err)
	}

	block, err := aes.NewCipher([]byte(key))
	if err != nil {
		panic(err)
	}

	// The IV is the first block of the ciphertext
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertext, ciphertext)

	// Remove PKCS#7 padding
	plaintext := unpad(ciphertext)
	fmt.Println("@@@@@@@@@@@")
	fmt.Println(plaintext)
	return string(plaintext)
}

func generate_key() string {
	keyLength := 32 // Length of key in bytes
	key := make([]byte, keyLength)

	_, err := rand.Read(key)
	if err != nil {
		panic(err)
	}
	return string(key)
}

func web3call() {
	client, err := ethclient.Dial("https://rpc-mumbai.maticvigil.com")
	if err != nil {
		panic(err)
	}

	// Set the contract address and function signature
	contractAddress := common.HexToAddress("0xDCaC1F81a5e2611b092068F9aDc75fF8f273E97C")
	abiFile, err := ioutil.ReadFile("abi.json")
	if err != nil {
		panic(err)
	}
	abiReader := bytes.NewReader(abiFile)
	contractAbi, _ := abi.JSON(abiReader)
	functionSignature := "allocateTokens(address,address,uint256)"

	// Pack the function arguments
	from := common.HexToAddress("0x294bedFf7EddcEf40447837Bc788F2f9Cdde34Cc")
	to := common.HexToAddress("0x0aE7573d7413eF31930915c47B451503276f5C14")
	amount := big.NewInt(10000)
	packedArgs, err := contractAbi.Pack(functionSignature, from, to, amount)
	if err != nil {
		fmt.Println(err)
		panic(err)
	}

	// Make the contract call
	callResult, err := client.CallContract(context.Background(), ethereum.CallMsg{
		To:   &contractAddress,
		Data: packedArgs,
	}, nil)
	if err != nil {
		panic(err)
	}

	// Unpack the result
	var result string
	err = contractAbi.UnpackIntoInterface(&result, functionSignature, callResult)
	if err != nil {
		panic(err)
	}

	// Print the result
	fmt.Println(result)
}
