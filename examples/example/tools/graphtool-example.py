#!/usr/bin/env python

from graphtool.web import WebHost
import cherrypy

if __name__ == '__main__':
  WebHost( file='../config/website.xml' ) 
  cherrypy.engine.start() 
  cherrypy.engine.block()

