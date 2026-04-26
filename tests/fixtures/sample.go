package main

import (
    "os"
    "fmt"
)

func main() {
    dbURL := os.Getenv("DATABASE_URL")
    goOnlyVar := os.Getenv("GO_ONLY_VAR")
    fmt.Println(dbURL, goOnlyVar)
}
