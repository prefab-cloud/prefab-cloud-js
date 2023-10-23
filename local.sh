# clean up old links
# cd /Users/ayip/src/prefab-cloud-bullet-web/app/react-ui
# rm -rf node_modules
# yarn install --force

# build js client
cd /Users/ayip/src/prefab-cloud-js/
npm run build
ls dist/src

# link and build react client
rm -rf /Users/ayip/src/prefab-cloud-react/node_modules/@prefab-cloud/prefab-cloud-js/dist
ln -s /Users/ayip/src/prefab-cloud-js/dist /Users/ayip/src/prefab-cloud-react/node_modules/@prefab-cloud/prefab-cloud-js/dist
cd /Users/ayip/src/prefab-cloud-react/
npm run build

# link bullet-web
cd /Users/ayip/src/prefab-cloud-js/
rm -rf /Users/ayip/src/prefab-cloud-bullet-web/app/react-ui/node_modules/@prefab-cloud/prefab-cloud-js/dist
ln -s /Users/ayip/src/prefab-cloud-js/dist /Users/ayip/src/prefab-cloud-bullet-web/app/react-ui/node_modules/@prefab-cloud/prefab-cloud-js/dist
rm -rf /Users/ayip/src/prefab-cloud-bullet-web/app/react-ui/node_modules/@prefab-cloud/prefab-cloud-react/dist
ln -s /Users/ayip/src/prefab-cloud-react/dist /Users/ayip/src/prefab-cloud-bullet-web/app/react-ui/node_modules/@prefab-cloud/prefab-cloud-react/dist

# link sandbox
rm -rf /Users/ayip/src/react-sandbox/node_modules/@prefab-cloud/prefab-cloud-js/dist
ln -s /Users/ayip/src/prefab-cloud-js/dist /Users/ayip/src/react-sandbox/node_modules/@prefab-cloud/prefab-cloud-js/dist
rm -rf /Users/ayip/src/react-sandbox/node_modules/@prefab-cloud/prefab-cloud-react/dist
ln -s /Users/ayip/src/prefab-cloud-react/dist /Users/ayip/src/react-sandbox/node_modules/@prefab-cloud/prefab-cloud-react/dist
