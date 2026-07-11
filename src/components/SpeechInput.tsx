import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface SpeechInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  rows?: number
  inputClass?: string
}

function SpeechInput({ value, onChange, placeholder, className, rows, inputClass }: SpeechInputProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [])

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Brauzeringiz ovozli matn kiritishni qo\'llab-quvvatlamaydi')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'ru-RU'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      onChange((value + ' ' + transcript).trim())
    }

    recognition.onerror = () => {
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setListening(false)
  }

  const toggleMic = () => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const baseBtnClass = `flex-shrink-0 p-1.5 rounded transition-colors ${
    listening
      ? 'bg-red-500 text-white animate-pulse'
      : 'text-muted hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100'
  }`

  if (rows) {
    return (
      <div className={`group relative flex items-start gap-1 ${className || ''}`}>
        <textarea
          ref={inputRef as any}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={inputClass || "w-full px-2 py-1.5 text-xs border border-transparent rounded focus:outline-none focus:border-primary focus:bg-white bg-transparent resize-none leading-relaxed"}
        />
        <button
          type="button"
          onClick={toggleMic}
          className={baseBtnClass}
          title={listening ? 'To\'xtatish' : 'Ovozli matn kiritish'}
        >
          {listening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
      </div>
    )
  }

  return (
    <div className={`group relative flex items-center gap-1 ${className || ''}`}>
      <input
        ref={inputRef as any}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass || "w-full px-2 py-1.5 text-sm border border-transparent rounded focus:outline-none focus:border-primary focus:bg-white bg-transparent text-center"}
      />
      <button
        type="button"
        onClick={toggleMic}
        className={baseBtnClass}
        title={listening ? 'To\'xtatish' : 'Ovozli matn kiritish'}
      >
        {listening ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
    </div>
  )
}

export default SpeechInput
