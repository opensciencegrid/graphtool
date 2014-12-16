
import re

"""
  MySQL logic separators for parentheses block removal
"""
mysql_logic_ops = [" AND "," &&",")AND ",")&&",   # Logical AND
                   " OR "," ||",")OR ",")||",     # Logical OR
                   " NOT "," !",")NOT ",")!",     # Logical NOT
                   " XOR ",")XOR ",                 # Logical Exclusive OR
                   " WHERE ",")WHERE "]             # SQL where Clause

"""
  MySQL logic separators regex escaped
"""
mysql_logic_ops_escaped = [re.escape(op.lower())+"|" for op in mysql_logic_ops]

"""
  MySQL logic separators regex pattern
"""
mysql_ops_and_parenthesis_pattern = "("
for esc_i in mysql_logic_ops_escaped:
  mysql_ops_and_parenthesis_pattern += esc_i
mysql_ops_and_parenthesis_pattern+=re.escape("(")+")"


"""
  Remove characters to the left until it finds a MySQL logic separator
"""
def remove_to_the_left_until_mysql_operator(text):
  text_test = text.lower()
  re_match = re.findall(mysql_ops_and_parenthesis_pattern, text_test.strip())
  if re_match is None or len(re_match) == 0:
    return text_test
  last_found = re_match[-1]
  rem_index = text_test.rindex(last_found)
  return text[:rem_index+len(last_found)]


def replace_parentheses_block_to_the_left(text,left_bracket_pos,replacement=""):
  if text[left_bracket_pos] != ")":
    return text
  index = left_bracket_pos
  open_brackets = 1
  while open_brackets > 0 and index >=0:
    index -= 1
    if text[index] == ")":
      open_brackets += 1
    elif text[index] == "(":
      open_brackets -= 1
  if index < 0:
    return text
  left_hand = text[:index]
  left_hand = remove_to_the_left_until_mysql_operator(left_hand)+replacement
  return left_hand+text[left_bracket_pos+1:]

def rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(':'+param_i),":-"+str(pos)+"-",query)
  return query

def reverse_rename_params(query,params):
  for pos, param_i in enumerate(params):
    query = re.sub(re.escape(":-"+str(pos)+"-"),':'+param_i,query)
  return query

def reduce_regexp_usage(query,variables):
  query = re.sub('\\s+',' ',query)
  query = rename_params(query,variables.keys())
  
  for index,var_i in enumerate(variables.keys()):
    if variables[var_i] == ".*":
      parentheses_pattern_esc = re.escape(") regexp :-"+str(index)+"-")
      result = re.search(parentheses_pattern_esc, query)
      while result != None:
        query = re.sub(parentheses_pattern_esc,")",query,1)
        query = replace_parentheses_block_to_the_left(query, result.start(), " true ")
        result = re.search(parentheses_pattern_esc, query)
      query = re.sub("[^\\s\\(]+"+re.escape(" regexp :-"+str(index)+"-"),'true',query)
    elif isinstance(variables[var_i], basestring):
      var_parts = variables[var_i].split('|')
      match = True
      for part_i in var_parts:
        if re.match("^\w+$", part_i) is None:
          match = False
          break
      if match:
        in_clause = " in ("
        for part_i in var_parts:
          in_clause += "'"+part_i+"',"
        in_clause = in_clause[:len(in_clause)-1]+")"
        query = re.sub(re.escape(" regexp :-"+str(index)+"-"), in_clause, query)
  query = reverse_rename_params(query, variables.keys())
  return query

