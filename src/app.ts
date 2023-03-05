import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi'
 
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
 
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'
import dotenv from 'dotenv';
require('dotenv').config();

 
// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const api_key = process.env.ALCHEMY_API_KEY_TESTNET
const { chains, provider, webSocketProvider } = configureChains(
  [mainnet],
  [alchemyProvider({ apiKey: 'FxWHM9uC3DT9r4WCCvRsNujUekAHlByO' }), publicProvider()],
)
 
// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
  ],
  provider,
  webSocketProvider,
})
 
// Pass client to React Context Provider
function App() {
  return (
    <WagmiConfig client={client}>
      <Profile />
    </WagmiConfig>
  )
}