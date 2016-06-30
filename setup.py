#!/usr/bin/env python

import sys, os
#sys.path.append(os.path.dirname(os.path.abspath(__file__))+'/graphtool-0.6.6-py2.6.egg')

try:
    import ez_setup
    ez_setup.user_setuptools()
except:
    pass

from setuptools import setup, find_packages

setup(
    name = 'graphtool',
    version = '0.9.0',
    description = 'CMS Common Graphing Package',
    author = 'Brian Bockelman',
    author_email = "bbockelm@cse.unl.edu",
    url="http://t2.unl.edu/documentation/gratia_graphs",

    packages = ['graphtool', 'graphtool.utilities', 'graphtool.tools', 'graphtool.tools.selenium', 'graphtool.base', 'graphtool.web', \
                    'graphtool.graphs', 'graphtool.database', 'graphtool.static_content'],
    package_dir = {'graphtool':'src/graphtool'},
    package_data = {'':['*.py',
                        '*.txt',
                        '*.in',
                        '*.sh',
                        '*.cfg',
                        '*.xml',
                        '*.conf',
                        'matplot*',
                        '*.spec',
                        'READ*'
                        ] 
                    },
    include_package_data = True,

    classifiers = [
          'Development Status :: 3 - Alpha',
          'Intended Audience :: Developers',
          'Programming Language :: Python',
          'Natural Language :: English',
          'Operating System :: POSIX'
    ],
    
    #dependency_links = ['http://effbot.org/downloads/Imaging-1.1.6.tar.gz#egg=PIL-1.1.6'],
    #install_requires=["CherryPy<=3.1", "matplotlib<=0.90.1", "numpy", "PIL"],
   
    entry_points={
        'console_scripts': [
            'graphtool = graphtool.utilities.graphtool_cli:main'
        ],
        'setuptools.installation' : [
            'eggsecutable = graphtool.utilities.graphtool_cli:main'
        ]
    }

    )
