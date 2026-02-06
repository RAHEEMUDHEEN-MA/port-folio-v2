### To kickstart the boilerplate, run the following commands:

```bash
yarn

yarn dev
```

### If you do not have yarn installed, delete the `yarn.lock` file and install via npm,

```bash
npm install

npm run dev
```

### Or install yarn:

```bash
npm install --global yarn
```

### Deployment Strategy (not yet implemented CI/CD)

1. Push changes to the repository:
   ```bash
   git push
   ```

2. Build the project locally:
   ```bash
   npm run build
   ```

3. Copy the build files to the VPS using `scp`.
    ```bash
    scp -r dist/* user@vps:/var/www/port-folio
    ```

4. If new files are added, ensure permissions are toggled correctly on the server.
