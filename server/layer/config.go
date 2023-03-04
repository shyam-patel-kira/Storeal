package layer

import (
	"github.com/spf13/viper"
)

type Config struct {
	Infra               int
	API_ENDPOINT_UPLOAD string
	API_ENDPINT_GET     string
	METHOD              string
	KEY                 string
	AUTH                bool
}

func LoadConfig() Config {
	viper.SetConfigFile("config_ipfs.yaml")
	err := viper.ReadInConfig()
	if err != nil {
	}

	config := Config{
		Infra:               viper.GetInt("infra"),
		API_ENDPOINT_UPLOAD: viper.GetString("api_endpoint_upload"),
		API_ENDPINT_GET:     viper.GetString("api_endpoint_get"),
		METHOD:              viper.GetString("method"),
		KEY:                 viper.GetString("key"),
		AUTH:                viper.GetBool("auth"),
	}
	return config
}
