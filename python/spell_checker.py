import enchant
from enchant.checker import SpellChecker
from nltk.metrics.distance import edit_distance

class MySpellChecker():

    def __init__(self, dict_name='en_US', max_dist=2):
        self.spell_dict = enchant.Dict(dict_name)
        self.max_dist = max_dist

    def replace(self, word):
        suggestions = self.spell_dict.suggest(word)

        if suggestions:
            for suggestion in suggestions:
                if edit_distance(word, suggestion) <= self.max_dist:
                    return suggestions[0]

        return word


if __name__ == '__main__':
    #text = "this is sme text with a speling mistake."

    text = "shushi"
    my_spell_checker = MySpellChecker(max_dist=1)
    chkr = SpellChecker("en_US", text)
    for err in chkr:
        print(err.word + " at position " + str(err.wordpos))
        err.replace(my_spell_checker.replace(err.word))

    t = chkr.get_text()
    print("\n" + t)