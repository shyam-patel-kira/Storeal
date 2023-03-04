package main

import (
	"fmt"
	"log"
	"net/http"
	"server/layer"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Home Page Endpoint Hit")
}

func handleRequests() {
	myRouter := mux.NewRouter().StrictSlash(true)
	config := layer.LoadConfig()
	myRouter.HandleFunc("/", homePage)
	myRouter.HandleFunc("/document/{username}", func(w http.ResponseWriter, r *http.Request) {
		layer.InsertData(w, r, config)
	}).Methods("POST") //Add document
	myRouter.HandleFunc("/document/{uuid}", func(w http.ResponseWriter, r *http.Request) {
		layer.FetchData(w, r, config)
	}).Methods("GET") // Get document by uuid
	myRouter.HandleFunc("/documents/user/{username}", layer.FetchDataByUser).Methods("GET") // Get all documents by user

	headersOk := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	originsOk := handlers.AllowedOrigins([]string{"*"})
	methodsOk := handlers.AllowedMethods([]string{"GET", "HEAD", "POST", "PUT", "OPTIONS"})
	// start server listen
	// with error handling
	// CORS
	log.Fatal(http.ListenAndServe(":10000", handlers.CORS(originsOk, headersOk, methodsOk)(myRouter)))
}

func load_config() {
	panic("unimplemented")
}

func main() {
	fmt.Println("Starting ControlDB Middleware Server")
	handleRequests()
}
