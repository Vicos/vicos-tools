for %%x in (*.avi) do mkvmerge "%%x" -o "%%~nx.mkv" --default-language fre
pause