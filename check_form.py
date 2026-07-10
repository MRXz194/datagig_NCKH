import urllib.request, re
url = 'https://docs.google.com/forms/d/e/1FAIpQLSdlJGhePyP_EtAvnEXByAEaCk_SfQ90rc2YW0YKXRNMGCw2BQ/viewform'
html = urllib.request.urlopen(url).read().decode('utf-8')
inputs = re.findall(r'name="entry\.(\d+)"', html)
unique_inputs = set(inputs)
print('Form inputs found:', len(unique_inputs))
print(unique_inputs)

titles = re.findall(r'<div class="freebirdFormviewerComponentsQuestionBaseTitle[^>]*>(.*?)</div>', html)
print('Titles:', len(titles))
