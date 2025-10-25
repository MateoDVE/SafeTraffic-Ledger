// pages/_app.tsx
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { WalletProvider } from '../components/WalletProvider'  // ⬅️ IMPORTANTE

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.variable} font-sans bg-[#0b111f] text-slate-100 min-h-screen`}>
      <WalletProvider>   {/* ⬅️ ENVOLVER TODA LA APP */}
        <Component {...pageProps} />
      </WalletProvider>
    </div>
  )
}
