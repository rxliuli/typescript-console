import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { useInterval } from 'react-use'

function App() {
  const [time, setTime] = useState(new Date())
  useInterval(() => {
    setTime(new Date())
  }, 1000)
  return <div>Time: {time.toISOString()}</div>
}

createRoot(document.body).render(<App />)
