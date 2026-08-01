import os
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_cors import CORS
from google import genai as google_genai


app = Flask(__name__)
CORS(app)

load_dotenv()

api_key = os.getenv("API_KEY")
try:

    gemini_client = google_genai.Client( api_key= api_key)
except Exception:
    gemini_client = None


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/receber_dados', methods=['POST'])
def receber_dados():
    data = request.get_json(silent=True) or {}

    question = data.get('question') or data.get('pergunta')
    user_answer = data.get('user_answer') or data.get('resposta') or data.get('resposta_usuario')
    correct_answer = data.get('correct_answer') or data.get('resposta_correta')
    alternative_answers = data.get('alternative_answers') or data.get('respostas_alternativas') or []

    if not all([question, user_answer, correct_answer]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if gemini_client == None:
        print("kd esse krl")
    
    

    result = corrigir_gemini(question, user_answer, correct_answer, alternative_answers)

    print(result)  # Debugging line to print the result
    return jsonify({'message': 'Data received successfully', 'result': result}), 200

@app.route('/receber_correcao', methods=['POST'])
def mensagem_resposta_errada():
    data = request.get_json(silent=True) or {}

    question = data.get('question') or data.get('pergunta')
    user_answer = data.get('user_answer') or data.get('resposta') or data.get('resposta_usuario')
    correct_answer = data.get('correct_answer') or data.get('resposta_correta')
    alternative_answers = data.get('alternative_answers') or data.get('respostas_alternativas') or []
    dicas = data.get('hints') or data.get('dicas') or []
    resposta_gemini = ""

    if not all([question, user_answer, correct_answer]):
        return jsonify({'error': 'Missing required fields'}), 400

    if corrigir_gemini(question, user_answer, correct_answer, alternative_answers) == "No":
        resposta_gemini = gerar_mensagem_resposta_errada(question, user_answer, correct_answer, alternative_answers, dicas)

    return jsonify({'message': 'mensagem errada', 'resposta': resposta_gemini})

def _normalize_answers(alternative_answers):
    if not alternative_answers:
        return []
    if isinstance(alternative_answers, str):
        return [alternative_answers]
    return [answer for answer in alternative_answers if answer]


def _extract_gemini_text(response):
    if response is None:
        return ''

    if isinstance(response, dict):
        text = response.get('text')
        if text:
            return str(text)
        candidates = response.get('candidates') or []
        if candidates:
            content = candidates[0].get('content', {})
            parts = content.get('parts', [])
            if parts:
                return ''.join(part.get('text', '') for part in parts if isinstance(part, dict))
        return ''

    text = getattr(response, 'text', None)
    if text:
        return str(text)

    output_text = getattr(response, 'output_text', None)
    if output_text:
        return str(output_text)

    return str(response)


def _heuristic_correction(user_answer, correct_answers):
    
    if not user_answer:
        return 'No'

    normalized_user_answer = ' '.join((user_answer or '').lower().split())
    for answer in correct_answers:
        normalized_answer = ' '.join((answer or '').lower().split())
        if normalized_answer and (
            normalized_answer in normalized_user_answer or normalized_user_answer in normalized_answer
        ):
            print("caso1")
            return 'Yes'

        user_tokens = set(normalized_user_answer.split())
        answer_tokens = set(normalized_answer.split())
        if answer_tokens and len(user_tokens & answer_tokens) >= max(2, len(answer_tokens) // 2):
            print("caso2")
            return 'Yes'

    return 'No'


def corrigir_gemini(question, user_answer, correct_answer, alternative_answers):
    all_correct_answers = [correct_answer] + _normalize_answers(alternative_answers)
    prompt = (
        f"Question: {question}\n"
        f"User Answer: {user_answer}\n"
        f"Correct Answers: {', '.join(all_correct_answers)}\n"
        "Gemine, verifique se a resposta do usuário está correta, mas para isso, considere a pergunta as possíveis respostas. Quero que você interprete o que o usuário digitou pra ver se ele acertou ou não a pergunta.  Sua resposta deverá ser 'Yes' ou 'No'" \
        "Tenha cuidado caso estejam sendo usadas palavras presentes no gabarito. Veja se elas tem sentido semântico e que no geral contibuam para uma resposta correta ou se estão lançadas mas em um contexto diferente do esperado para uma resposta certa e se as definições apresentadas das palvras (caso tiver) são definições corretas do conceito apresentado na resposta do usuário"
    )


    if gemini_client is None:
        return _heuristic_correction(user_answer, all_correct_answers)

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        model_response = _extract_gemini_text(response).strip()
        if not model_response:
            print("not model response")
            return _heuristic_correction(user_answer, all_correct_answers)

        normalized_response = model_response.splitlines()[0].strip().lower()
        if normalized_response.startswith('yes'):
            return 'Yes'
        if normalized_response.startswith('no'):

            return 'No'
        return 'Yes' if 'yes' in normalized_response else 'No'
    except Exception as exc:
        print(f"Gemini error: {exc}")
        return _heuristic_correction(user_answer, all_correct_answers)

def gerar_mensagem_resposta_errada(question, user_answer, correct_answer, alternative_answers, hints):
    all_correct_answers = [correct_answer] + _normalize_answers(alternative_answers)
    prompt = (
        f"Question: {question}\n"
        f"User Answer: {user_answer}\n"
        f"Hints: {hints}\n"
        f"Correct Answers: {', '.join(all_correct_answers)}\n"
        "Se a resposta do usuário estiver incorreta, explique de forma curta e em português por que ela estava errada, destacando o ponto principal que faltou. Responda em até 2 frases."
    )

    if gemini_client is None:
        print ("sem resposta")
        return (
            f"Sua resposta ficou incompleta. A ideia central era: {correct_answer}. "
            "Revise os pontos principais e tente novamente."
        )

    try:
        response = gemini_client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
        )
        print("resposta gemini")
        return _extract_gemini_text(response).strip() 
        #     or (
        #     f"Sua resposta ficou incompleta. A ideia central era: {correct_answer}. "
        #     "Revise os pontos principais e tente novamente."
        # )
    except Exception as exc:
        print(f"Gemini correction error: {exc}")
        return (
            f"Sua resposta ficou incompleta. A ideia central era: {correct_answer}. "
            "Revise os pontos principais e tente novamente."
        )
    

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
