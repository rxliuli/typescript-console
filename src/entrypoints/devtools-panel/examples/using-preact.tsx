import { render } from 'preact'
import { useSignal } from '@preact/signals'
import { useInterval } from 'react-use'

function App() {
    const time = useSignal(new Date())
    useInterval(() => {
        time.value = new Date()
    }, 1000)
    return <div>Time: {time.value.toISOString()}</div>
}

render(<App />, document.body)
