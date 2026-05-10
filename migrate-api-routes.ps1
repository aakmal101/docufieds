$apiDir = "d:\Docufieds\src\app\api"

Get-ChildItem -Path $apiDir -Recurse -Filter "*.ts" | ForEach-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName)
    
    if ($content -match 'getServerSession') {
        # Remove NextAuth imports
        $newContent = $content -replace "import \{ getServerSession \} from 'next-auth'\r?\n", "" -replace "import \{ getServerSession \} from 'next-auth';\r?\n", "" -replace "import \{ authOptions \} from '@/lib/auth'\r?\n", "" -replace "import \{ authOptions \} from '@/lib/auth';\r?\n", ""
        
        # Add getCurrentUser import if not already present
        if ($newContent -notmatch "getCurrentUser") {
            $firstImportMatch = [regex]::Match($newContent, "^import .+$", [System.Text.RegularExpressions.RegexOptions]::Multiline)
            if ($firstImportMatch.Success) {
                $insertPos = $firstImportMatch.Index + $firstImportMatch.Length
                $importLine = "`nimport { getCurrentUser } from '@/lib/services/auth-service'"
                $newContent = $newContent.Insert($insertPos, $importLine)
            }
        }
        
        # Replace session patterns
        $newContent = $newContent -replace 'const session = await getServerSession\(authOptions\)', 'const user = await getCurrentUser()' -replace 'session\?\.user\.id', 'user?.id' -replace 'session\.user\.id', 'user!.id' -replace 'session\?\.user\.role', 'user?.role' -replace 'session\.user\.role', 'user!.role' -replace 'session\?\.user\.email', 'user?.email' -replace 'session\.user\.email', 'user!.email'
        
        # Replace null checks
        $newContent = $newContent -replace '\!session\?\.user\?\.id', '!user?.id'
        $newContent = $newContent -replace '\!session\?\.user', '!user'
        $newContent = $newContent -replace 'if \(\!session\)', 'if (!user)'
        
        # Update comments
        $newContent = $newContent -replace 'this route uses getServerSession', 'this route uses getCurrentUser'
        $newContent = $newContent -replace 'getServerSession and cookies', 'getCurrentUser and cookies'
        $newContent = $newContent -replace 'NextAuth Session', 'Supabase Auth'
        $newContent = $newContent -replace 'getServerSession needs', 'getCurrentUser needs'
        
        [System.IO.File]::WriteAllText($_.FullName, $newContent)
        Write-Output "MIGRATED: $($_.FullName)"
    }
}

Write-Output "Done!"
