export const speak = (text: string, lang: string = 'id-ID', interrupt: boolean = false) => {
    if (!('speechSynthesis' in window)) {
        console.warn('TTS not supported');
        return;
    }

    // Cancel any ongoing speech only if interrupt is requested
    if (interrupt) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Wait for voices to be loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        setBestVoice(utterance, voices);
        window.speechSynthesis.speak(utterance);
    } else {
        window.speechSynthesis.onvoiceschanged = () => {
            const updatedVoices = window.speechSynthesis.getVoices();
            setBestVoice(utterance, updatedVoices);
            window.speechSynthesis.speak(utterance);
        };
    }
};

const setBestVoice = (utterance: SpeechSynthesisUtterance, voices: SpeechSynthesisVoice[]) => {
    // Try to find an Indonesian voice
    const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
    // Fallback to Google Indonesian if available specific naming
    const googleIdVoice = voices.find(v => v.name.includes('Google Bahasa Indonesia'));

    utterance.voice = googleIdVoice || idVoice || null;
};
