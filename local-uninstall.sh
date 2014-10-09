#!/bin/bash

# Get Root Access
# stop service
# first uninstall in the correct order
# install again
# start service
echo "Root Access"
su root -c "rpm -e graphtool" 
