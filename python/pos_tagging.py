from nltk.tag import pos_tag 
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import sentiwordnet as swn
import sys


full_text = sys.argv[1]

sentence_list = sent_tokenize(full_text)
for sentence in sentence_list:
    words = word_tokenize(sentence)

pos_tagged_list = pos_tag( words )

print( pos_tagged_list )

'''
neg_words = [ 'no', 'never', 'not', "n't", 'hardly', 'barely', 'seldom' ]
negate = False

if any(neg_word in words for neg_word in neg_words):
    words = [word for word in words if word not in neg_words]
    negate = True

total_net_score = 0.0
total_obj_score = 0.0
total_pos_score = 0.0
total_neg_score = 0.0

debug = True
def map_tag(tag):
    if tag == 'JJ' or tag == 'JJR' or tag == 'JJS':
        return 'a' 
    if tag == 'RB' or tag == 'RBR' or tag == 'RBS':
        return 'r'
    if tag == 'NN' or tag == 'NNS' or tag == 'NNP' or tag == 'NNPS':
        return 'n'
    if tag == 'VB' or tag == 'VBD' or tag == 'VBG' or tag == 'VBN' or tag == 'VBP' or tag == 'VBZ':
        return 'v'
    return ''

def get_redis_conn():
    success_conn = False
    tries = 0

    while not success_conn and tries < 10:
        try:
            redis_conn = redis.StrictRedis(host='localhost', port=6379)
            success_conn = True
        except:
            print("retry redis connection")
            tries = tries + 1
            time.sleep(5)

    if not success_conn:
        sys.exit("backend redis conn failed")
    return redis_conn


for this_tagged_set in pos_tagged_list:
    this_word = this_tagged_set[0].lower()
    senti_tag = map_tag(this_tagged_set[1])

    if senti_tag is not '':
        #print('%s : %s' % (this_word, senti_tag))
        synsets = list(swn.senti_synsets(this_word, senti_tag))

        if len(synsets) > 0:
            # the synsets return could contain all potential match of the word, picking the first one that match the exact word and tag 
            for synset in synsets:
                this_set_name = synset.synset.name()
                word_in_this_set = (this_set_name.split('.'))[0]
                pos_in_this_set = (this_set_name.split('.'))[1]
                if word_in_this_set == this_word and pos_in_this_set == senti_tag:
                    total_obj_score += synset.obj_score()
                    if not negate:
                        if debug :
                            print("%s : %f %f %f" % (this_word, synset.pos_score(), synset.neg_score(), synset.obj_score()))
                        
                        total_pos_score += synset.pos_score()
                        total_neg_score += synset.neg_score()
                        break
                    else:
                        if debug :
                            print("Negate: %s : %f %f %f" % (this_word, synset.pos_score(), synset.neg_score(), synset.obj_score()))
                        
                        total_pos_score += synset.neg_score()
                        total_neg_score += synset.pos_score()
                        break

total_net_score = total_pos_score - total_neg_score
print("score = +%f, -%f, net: %f, obj: %f" %  (total_pos_score, total_neg_score, total_net_score, total_obj_score))
'''
