
from Npp import *
from datetime import date

import ast
import oauth2 as oauth
import os
import re
import urllib

## Config
blogURL = 'btquotes.tumblr.com'

## Parsing

def getRawLogfromSelectionBloc():
  startLine,endLine = editor.getUserLineSelection() 
  startPos = editor.positionFromLine(startLine)
  endPos = editor.getLineEndPosition(endLine)
  editor.setSel(startPos,endPos)
  return editor.getSelText()
  
def extractDatefromRawLog(log):
  matches = re.match("^([0-9]{1,2})/([0-9]{1,2}) ([0-9]{2}):([0-9]{2}):([0-9]{2})\.[0-9]{3}",log).groups()
  year = date.today().year
  if date.today() < date(year,int(matches[0]),int(matches[1])):
    year = year -1
  strDate = "{0}-{1}-{2} {3}:{4}:{5}".format(year,*matches)
  return strDate

def cleanRawLog(log):
  lines = log.splitlines()
  datePattern = re.compile("^[0-9]{1,2}/[0-9]{1,2} [0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}")
  linkPattern = re.compile("\|H.*\|h.*\|h")
  for i in range(0,len(lines)):
    lines[i] = datePattern.sub("",lines[i]);
    lines[i] = linkPattern.sub("",lines[i]);
    lines[i] = lines[i].strip()
  return "\n".join(lines)

## Web

def sendLogtoTumblr(log,date):
  # get token info from generated file
  tokenFilepath = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'tokens')
  with open(tokenFilepath, 'r') as f:
    tokens = ast.literal_eval(f.read())
  
  # initialize oAuth2 client
  consumer = oauth.Consumer(**tokens['consumer'])
  token = oauth.Token(**tokens['access'])
  client = oauth.Client(consumer, token)
  
  # initialize tumblr API params
  target = "http://api.tumblr.com/v2/blog/%s/post" % (blogURL)
  params = {
    'type': 'chat',
    'state': 'draft',
    'conversation': log,
    'date': date,
  }
  
  # send request
  resp, body = client.request(
    target,
    method="POST",
    body=urllib.urlencode(params)
  );
  
  # check reply
  if resp.status == 201:
    notepad.messageBox("Post created on Tumblr")
  else:
    notepad.messageBox("Failed to create post on Tumblr! "+content)

## Main

log = getRawLogfromSelectionBloc()
tumblrDate = extractDatefromRawLog(log)
log = cleanRawLog(log)

sendLogtoTumblr(log,tumblrDate)
