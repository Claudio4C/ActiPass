import { useState, useEffect } from 'react'

export default function TestComponent() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    console.log(`Count is: ${count}`)
  }, [count])

  function clickHandler() {
    setCount(count + 1)
  }

  return (
    <div>
      <h1>Hello world</h1>
      <button onClick={clickHandler}>Click me</button>
    </div>
  )
}
