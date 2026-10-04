Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = scriptDir

' 1. Kiem tra va khoi dong dev-server neu chua chay
cmd = "cmd.exe /c """ & "C:\Program Files\nodejs\node.exe" & """ """ & scriptDir & "\dev-server.js"""
WshShell.Run cmd, 0, False

' 2. Cho server khoi dong 1.5 giay roi tu dong mo trinh duyet
WScript.Sleep 1500
WshShell.Run "http://localhost:3000"

Set WshShell = Nothing
Set fso = Nothing
