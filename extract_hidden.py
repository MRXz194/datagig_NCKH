import re
with open('form.html', 'r', encoding='utf-8') as f:
    text = f.read()
    for match in re.finditer(r'<input type=\"hidden\" name=\"(.*?)\" value=\"(.*?)\"', text):
        print(match.group(1), '=', match.group(2))
