package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type Config struct {
	CircleRadius int         `json:"circleRadius"`
	Timer        TimerConfig `json:"timer"`
}

type TimerConfig struct {
	Interval   int `json:"interval"`   // in minutes
	ShortBreak int `json:"shortBreak"` // in minutes
	LongBreak  int `json:"longBreak"`  // in minutes
}

var DefaultConfig = Config{
	CircleRadius: 230,
	Timer: TimerConfig{
		Interval:   25, // minutes
		ShortBreak: 5,  // minutes
		LongBreak:  15, // minutes
	},
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
}

func ReadConfigFromFile(file string) (*Config, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, fmt.Errorf("Failed to open file: %v", err)
	}
	defer f.Close()

	var config Config
	decoder := json.NewDecoder(f)
	if err := decoder.Decode(&config); err != nil {
		return nil, fmt.Errorf("Failed to deocde JSON: %v", err)
	}
	return &config, nil
}

func main() {
	http.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
        enableCors(&w)
		if r.Method != http.MethodGet {
			http.Error(w, "Method is not allowed", http.StatusMethodNotAllowed)
			return
		}
		config, err := ReadConfigFromFile("config.json")

		if err != nil {
			fmt.Println("Failed to read config from file, use default config instead")
			config = &DefaultConfig
		}

		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(config); err != nil {
			http.Error(w, "Failed to encode JSON", http.StatusInternalServerError)
		}
	})

	fmt.Println("Server is running at port 3000")
	http.ListenAndServe(":3000", nil)
}
