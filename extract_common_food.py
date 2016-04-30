from nltk.corpus import wordnet as wn
food = wn.synset('food.n.02')
food_names=list(set([w for s in food.closure(lambda s:s.hyponyms()) for w in s.lemma_names()]))
with open("commom_foods.txt", 'w') as f:
    for s in food_names:
    	s = s.replace("_"," ").replace("-"," ")
        f.write(s + '\n')